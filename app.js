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
//      express = require('express'),
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
      Q = require('q'),
      ca = new (require('./lib/ca'))(),
      cfg = new (require('./etc/partout.conf.js'))(),
      utils = require('./agent/lib/utils'),
      pfs = require('./agent/lib/pfs'),
      _ = require('lodash');

const arangodbAdaptor = require('sails-arangodb');

const debug = require('debug').debug('partout:app');

Q.longStackSupport = true;

//process.on('unhandledRejection', r => console.warn(r));


/**
 * Partout Master App provider
 * @class
 */
class App {
  constructor() {
    this.envs_changed = false;
    this.env_changed = {};
    this.env_watchers = {};
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
  } // loadEnvironments

  loadPermissions() {
    const self = this;
    return new Promise((resolve, reject) => {

      // load etc/permissions.json
      fs.readFile('etc/permissions.json', (err, data) => {
        if (err) {
          return reject(err);
        }
        const perms = JSON.parse(data.toString());
        debug('perms:', perms);

        // import any missing or changed entries into permissions collection
        let promises = [];
        perms.forEach((perm) => {
          debug('perm:', perm);
          promises.push(new Promise((inner_resolve, inner_reject) => {
            debug('before find');
            self.appUi.app.service('permissions')
            .find({query: {
              type: perm.type,
              subtype: perm.subtype,
              name: perm.name
            }})
            .then((perm_res) => {
              debug('perm_res:', perm_res);

              if (perm_res.total === 0) {
                // Create
                self.appUi.app.service('permissions')
                .create(perm)
                .then(() => {
                  inner_resolve();
                })
                .catch((err) => {
                  inner_reject(err);
                });

              } else if (perm_res.total === 1) {
                // Update
                debug('updating ', perm_res.data[0].id, 'with:', perm);
                self.appUi.app.service('permissions')
                .patch(perm_res.data[0].id, perm)
                .then(() => {
                  inner_resolve();
                })
                .catch((err) => {
                  inner_reject(err);
                });
              } else {
                let errmsg = `permissions query returned >1 results, perm: ${perm.type}, perm_res: ${perm_res.total} - ${typeof perm_res.total}`;
                console.error(errmsg);
                throw new Error(errmsg);
              }
            })
            .catch((err) => {
              console.error(err);
              inner_reject(err);
            });
          }));
        });
        Promise.all(promises)
        .then(() => {
          debug('permissions load complete');
          resolve();
        })
        .catch((err) => {
          console.error(err);
          reject(err);
        });
      });

    });
  } // loadPermissions

  loadDefaultRoles() {
    const self = this;
    debug('roles');
    return new Promise((resolve, reject) => {
      debug('in promise');
      // If there are no roles
      self.appUi.app.service('roles')
      .find()
      .then((roles_res) => {
        debug('roles_res:', roles_res);
        if (roles_res.total > 0) {
          return resolve();
        }

        // load the default set from etc/roles.json
        fs.readFile('etc/roles.json', (err, data) => {
          if (err) {
            return reject(err);
          }
          const roles = JSON.parse(data.toString());
          debug('roles:', roles);
          let promises = [];
          roles.forEach((role) => {
            promises.push(new Promise((inner_resolve, inner_reject) => {
              debug('creating role:', role);
              self.appUi.app.service('roles')
              .create(role)
              .then(() => { inner_resolve(); })
              .catch((err) => { inner_reject(err); });
            }));
          });
          Promise.all(promises)
          .then(() => { resolve(); })
          .catch((err) => { reject(err); });
        });
      })
      .catch((err) => {
        console.error('find roles err:', err);
        reject(err);
      });
    });
  } // loadDefaultRoles

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

      return Q.ninvoke(ca, 'generateTrustedCertChain')
      .then(() => {

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
        self.appUi = new AppUi();
        return self.appUi.init(opts)
        .then(() => {

          /****************************
           * Start Master API Server
           */
          self.appApi = new AppApi(opts, self.appUi);

          return self.loadPermissions()
          .then(() => {
            return self.loadDefaultRoles();
          })
          .then(() => {
            self.loadEnvironments();
            self.watchEnvironments();
          });
        });
      });

    })
    .done();
  }

  /**
   * Run Partout CLI
   * @memberof App
   */

  run(opts) {
    if (opts.serve) {
      this.serve(opts);

    } else {
      console.error('Error: Unrecognised command');
      process.exit(1);
    }
  }
}

module.exports = App;
