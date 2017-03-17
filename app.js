/*jshint multistr: true*/
/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2017 Graham Lee Bevan <graham.bevan@ntlworld.com>

    This file is part of Partout.

    Partout is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*jslint node: true */
/*jshint esversion: 6 */
'use strict';
process.env.BLUEBIRD_WARNINGS = 0; // bluebird warnings in feathersjs
process.env.BLUEBIRD_LONG_STACK_TRACES = 1;

const console = require('better-console'),
      AppUi = require('./appUi.js'),
      AppApi = require('./appApi.js'),
      express = require('express'),
      flash = require('connect-flash'),
      bodyParser = require('body-parser'),
      pki = require('node-forge').pki,
      forge = require('node-forge'),
      morgan = require('morgan'),
      logger = morgan('combined'),
      compression = require('compression'),
      fs = require('fs'),
      path = require('path'),
      u = require('util'),
      keyFile = 'etc/ssl/server.key',
      certFile = 'etc/ssl/server.crt',
      os = require('os'),
      hostName = os.hostname(),
      ca = new (require('./lib/ca'))(),
      Q = require('q'),
      cfg = new (require('./etc/partout.conf.js'))(),
      utils = require('./agent/lib/utils'),
      pfs = require('./agent/lib/pfs'),
      serverMetrics = new (require('./lib/server_metrics'))(),
      _ = require('lodash'),
      ClientCertStrategy = require('passport-client-cert').Strategy,
      GitHubStrategy = require('passport-github2').Strategy,
      expressSession = require('express-session'),
      printf = require('printf'),
      uuid = require('uuid');

const Waterline = require('waterline'),
      arangodbAdaptor = require('sails-arangodb'),
      service = require('feathers-waterline'),
      serviceUtils = require('feathers-waterline/lib/utils'),
      errors = require('feathers-errors'),
      filter = require('feathers-query-filters'),
      ORM = new Waterline(),
      Agents = require('./server/models/agents'),
      Csrs = require('./server/models/csrs'),
      Environments = require('./server/models/environments'),
  //    Profiles = require('./server/models/profiles'),
      Users = require('./server/models/users'),
      Roles = require('./server/models/roles');

const debug = require('debug').debug('partout:app');

Q.longStackSupport = true;

//process.on('unhandledRejection', r => console.warn(r));

class CsrsService extends service.Service {
  constructor(o) {
    super(o);
  }

  register(agent_uuid, ip, csr) {
    console.log('csrsService register agent_uuid:', agent_uuid);

    var self = this,
        deferred = Q.defer(),
        now = new Date();

    // check if csr already exist for this agent's uuid (if one present)
    var p;
    if (agent_uuid) {
      p = self.find({query: {id: agent_uuid}});
    } else {
      p = Q.resolve({total: 0}); //fake empty query
    }
    //console.log('p:', p);
    return p
    .then(function (doc) {
      console.log('doc:', doc);

      if (doc.total === 0) {
        // Create new entry in csrs collection
        var newDoc = {
          id: ((agent_uuid && agent_uuid !== '') ? agent_uuid : uuid.v4()),
          ip: ip,
          csr: csr,
          status: 'unsigned',
          lastSeen: now
        };
        console.log('newDoc:', newDoc);
        return self.create(newDoc)
        .then(function (doc) {
          return doc;
        });

      } else {
        if (doc.total !== 1) {
          throw new Error('Csrs query by agent uuid returned incorrect number of records:', doc.total);
        }
        doc = doc.data[0];
        doc.csr = csr;
        doc.lastSeen = now;
        return self.update(doc.id, doc)
        .then(function () {
          return doc;
        });
      }
    });
  }
}

class AgentsService extends service.Service {
  constructor(o) {
    super(o);
  }

  // Overload _get method to populate environment
  // see https://github.com/feathersjs/feathers-waterline/blob/master/src/index.js (MIT)
  _find (params, count, getFilter = filter) {
    let { filters, query } = getFilter(params.query || {});
    let where = serviceUtils.getWhere(query);
    let order = serviceUtils.getOrder(filters.$sort);
    let options = filters.$select ? { select: Array.from(filters.$select) } : {};
    let counter = this.Model.count().where(where);
    let q = this.Model.find(where, options);

    if (order) {
      q.sort(order);
    }

    if (filters.$skip) {
      q.skip(filters.$skip);
    }

    if (filters.$limit) {
      q.limit(filters.$limit);
    }

    const performQuery = total => {
      return q
      .populate('environment')
      .then(data => {
        return {
          total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data
        };
      });
    };

    if (count) {
      return counter.then(performQuery);
    }

    return performQuery();
  }

  // Overload _get method to populate environment
  // see https://github.com/feathersjs/feathers-waterline/blob/master/src/index.js (MIT)
  _get (id) {
    return this.Model.findOne({ id })
    .populate('environment')
    .then((instance) => {
      if (!instance) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return instance;
    })
    .catch(utils.errorHandler);
  }
}

/**
 * Partout Master App provider
 * @class
 */
class App {
  constructor() {
    this.envs_changed = false;
    this.env_changed = {};
    this.env_watchers = {};

    this.waterline_config = cfg.waterline_config;
    this.waterline_config.adapters = {
      'default': arangodbAdaptor,
      arangodb: arangodbAdaptor
    };

    ///////////////////
    // FeathersJS

    ORM.loadCollection(Agents);
    ORM.loadCollection(Csrs);
    ORM.loadCollection(Environments);
//    ORM.loadCollection(Profiles);
    ORM.loadCollection(Users);
    ORM.loadCollection(Roles);

  }

  /**
   * Initialise partout server database services
   * @memberof App
   */
  init() {
    var deferred = Q.defer();

    ORM.initialize(this.waterline_config, (err, o) => {
      if (err) {
        console.error(err);
        throw new Error(err);
      }

//      o.collections.agents
//      .find({id: '4af22fcc-29b2-4aba-90e8-61b4cbe704d2'})
//      .populate('environment')
//      .then((res) => {
//        console.log('query success:', res.length);
//        o.collections.agents
//        .find()
//        .populate('environment')
//        .then((res) => {
//          console.log('find all success:', res.length);
//        });
//      });

//      debug('csrs find');
//      o.collections.csrs
//      .find()
//      .then((res) => {
//        debug('csrs res:', res.length);
//        process.exit(1);
//      })
//      .catch((err) => {
//        console.error('CSRS find test err:', err);
//        process.exit(1);
//      });

      /////////////////////////////
      // Global Feathers services

//      var csrsService = new CsrsService();

      this.services = {

        agents: new AgentsService({
          Model: o.collections.agents,
          paginate: {
            default: 10,
            max: 10
          }
        }),

//        csrs: service({
        csrs: new CsrsService({
          Model: o.collections.csrs,
          paginate: {
            default: 10,
            max: 10
          }
        }),

        environments: service({
          Model: o.collections.environments,
          paginate: {
            default: 10,
            max: 10
          }
        }),

        users: service({
          Model: o.collections.users,
          paginate: {
            default: 10,
            max: 10
          }
        }),

        roles: service({
          Model: o.collections.roles,
          paginate: {
            default: 10,
            max: 10
          }
        })
      };

      deferred.resolve();
    });

    return deferred.promise;
  }

  watchEnvironment(env) {
    if (!this.env_watchers[env]) {
      fs.watch(path.join(cfg.MANIFESTDIR, env), (eventType, filename) => {
        console.log(`watchEnvironment(${env}) Manifest watcher: ${eventType} on file: ${filename} env_changed: ${this.env_changed[env]}`);

        if (!this.env_changed[env]) {
          this.env_changed[env] = true;

          ((self) => {
            setTimeout(() => {
              self.loadEnvironments(env);
            }, 1000).unref(); // delay 1 sec, then load
          })(this);
        }
      });
    }
  }

  watchEnvironments() {
    fs.watch(cfg.MANIFESTDIR, (eventType, filename) => {
      debug('watchEnvironments() Manifest watcher:', eventType, 'on file:', filename, 'envs_changed:', this.envs_changed);
      if (!this.envs_changed) {
        this.envs_changed = true;

        ((self) => {
          setTimeout(() => {
            self.loadEnvironments();
          }, 1000).unref(); // delay 1 secs, then load
        })(this);
      }
    });

    // put watchers on each environment
    pfs.pReadDir(cfg.MANIFESTDIR)
    .then((files) => {
      files.forEach((env) => {
        if (env === '.gitignore') {
          return;
        }
        debug('watching environment:', env);
        this.watchEnvironment(env);
      });
    });
  }

  loadEnvironments(envChanged) {
    let promises = [];

    debug('envChanged:', envChanged);

    pfs.pReadDir(cfg.MANIFESTDIR)
    .then((files) => {
      files.forEach((file) => {
//        console.log('manifest file object:', file);
        promises.push(
          pfs.pStat(path.join(cfg.MANIFESTDIR, file))
          .then((stats) => {
            return {file, stats};
          })
        );
      });

      return Q.all(promises)
      .then((files_stats) => {
        let envs = files_stats.filter((v) => { return v.stats.isDirectory(); });

        if (envChanged) {
          envs = envs.filter((e) => { return e.file === envChanged; });
        }

        envs.forEach((file_stat) => {
          let env = file_stat.file,
              envJson = path.join(cfg.MANIFESTDIR, env, 'env.json');

          this.watchEnvironment(env);

          // look for env.json file
          fs.readFile(envJson, (err, envDataBuf) => {
            let envData = {};
            if (envDataBuf) {
              try {
                envData = JSON.parse(envDataBuf.toString());
              } catch(e) {
                console.error(`error parsing ${env} env.json:`, e);
              }
            }

            this.appUi.app.service('environments')
            .find({query: {name: env}})
            .then((res) => {
              if (res.total === 0) {
                console.log('added env:', env);
                return this.appUi.app.service('environments')
                .create({
                  name: env,
                  description: envData ? envData.description : ''
                });
              } else if (res.total === 1) {
                debug('updating env:', env, 'id:', res.data[0].id);
                return this.appUi.app.service('environments')
                .update(res.data[0].id, {
                  name: env,
                  description: envData ? envData.description : ''
                });
              } else {
                throw new Error('environments query returned more than 1 entries for name:', env);
              }
            })
            .catch((err) => {
              console.error('environments err:', err);
            });
          });
        });
      });
    })
    .done(() => {
      if (envChanged) {
        this.env_changed[envChanged] = false;
      } else {
        this.envs_changed = false;
      }
    });

  }

  /**
   * Serve the Partout Master API and UI engine
   * @memberof App
   */
  serve(opts) {
    var self = this;

    /**
     * Partout application server
     */

    console.info('Welcome to:');
    utils.print_banner();

    //console.clear();
    //console.info('--| Partout |-' + new Array(51).join('-') + '-| starting |--');
    console.info('Starting Partout Master Server...');

    /**
     * check for SSL certificates and their dependencies (CA root etc)
     */
    Q.ninvoke(ca, 'checkMasterApiCert')
    .then(function () {
      return Q.ninvoke(ca, 'checkMasterUiCert');
    })
    .then(function () {
      return Q.ninvoke(ca, 'checkAgentSignerCert');
    })
    .fail(function(err) {
      console.error('failed checking for certificates:', err);
      console.log(err.stack);
      throw (new Error(err));
    })
    .then(function() {
      console.info('Certificates ok, generating trusted key chain');

      ca.generateTrustedCertChain(function () {

        console.info('Starting Master API.');

        var pubKeyPem = fs.readFileSync(
          ca.masterApiPublicKeyFile
        );

        var pubKeyBin = forge.util.decode64(pubKeyPem.toString());

        var pubkey = pki.publicKeyFromPem(pubKeyPem);

        var master_fingerprint = pki.getPublicKeyFingerprint(
          pubkey,
          {
            encoding: 'hex',
            delimiter: ':',
            md: forge.md.sha256.create()
          }
        );
        console.info('');
        console.info(new Array(master_fingerprint.length + 1).join('='));
        console.info('Master API SSL fingerprint (SHA256):\n' + master_fingerprint);
        console.info('\nrandomart of master public key:\n' + utils.toArt(pubKeyBin));
        console.info(new Array(master_fingerprint.length + 1).join('='));

        /****************************
         * Start Master UI Server
         */
        self.appUi = new AppUi(opts, self.services);

        /****************************
         * Start Master API Server
         */
        self.appApi = new AppApi(opts, self.appUi);

        self.loadEnvironments();
        self.watchEnvironments();
      });

    })
    .done();
  }

  /**
   * Run Partout CLI
   * @memberof App
   */

  run(opts) {
    var uuid;

    this.init()
    .then(() => {

      if (opts.serve) {
        this.serve(opts);

      } else {
        console.error('Error: Unrecognised command');
        process.exit(1);
      }
    })
    .done();
  }
}

module.exports = App;
