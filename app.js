/*jshint multistr: true*/
/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

var console = require('better-console'),
    express = require('express'),
    routerApi = express.Router(),
    routerUi = express.Router(),
    httpsApi = require('https'),
    httpsUi = require('https'),
    bodyParser = require('body-parser'),
    pki = require('node-forge').pki,
    forge = require('node-forge'),
    morgan = require('morgan'),
    logger = morgan('combined'),
    compression = require('compression'),
    fs = require('fs'),
    u = require('util'),
    keyFile = 'etc/ssl/server.key',
    certFile = 'etc/ssl/server.crt',
    os = require('os'),
    hostName = os.hostname(),
    ca = new (require('./lib/ca'))(),
    Q = require('q'),
    cfg = new (require('./etc/partout.conf.js'))(),
    //arangojs = require('arangojs'),
    //db = arangojs({promise: Q.promise}),
    db = new (require('./lib/db.js'))(cfg),
    Csr = require('./server/controllers/csr.js'),
    Agent = require('./server/controllers/agent.js'),
    utils = require('./agent/lib/utils'),
    serverMetrics = new (require('./lib/server_metrics'))(),
    _ = require('lodash'),
    passport = require('passport'),
    ClientCertStrategy = require('passport-client-cert').Strategy,
    printf = require('printf');

Q.longStackSupport = true;

/**
 * Partout Master App provider
 * @class
 */
var App = function () {

};

/**
 * Initialise partout server database
 * @memberof App
 */
var init = function () {
  var deferred = Q.defer();

  console.info('Initialising...\n');
  utils.print_banner();

  db.connect()
  .then(function () {
    console.log('db connected');

    // Init ArangoDB Collections
    var csr = new Csr(db.getDb());
    var agent = new Agent(db.getDb());

    csr.init()
    .then(function (csrres) {
      console.log('csr init:', csrres);
      return agent.init();
    })
    .then(function(agentres) {
      console.log('agent init:', agentres);

      deferred.resolve();
    })
    .done();
  })
  .done();

  return deferred.promise;
};

/**
 * Serve the Partout Master API and UI engine
 * @memberof App
 */
var serve = function (opts) {
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

      var master_fingerprint = pki.getPublicKeyFingerprint(
        pki.publicKeyFromPem(
          fs.readFileSync(
            ca.masterApiPublicKeyFile
          )
        ),
        {
          encoding: 'hex',
          delimiter: ':',
          md: forge.md.sha256.create()
        }
      );
      console.info('');
      console.info(new Array(master_fingerprint.length + 1).join('='));
      console.info('Master API SSL fingerprint (SHA256):\n' + master_fingerprint);
      console.info(new Array(master_fingerprint.length + 1).join('='));

      db.connect()
      .then(function (status) {
        console.log('db:', status);

        //db.useDatabase(cfg.database_name);
        //console.warn('db:',db);

        var controllers = {
          'csr': new Csr(db.getDb()),
          'agent': new Agent(db.getDb())
        };
        controllers.csr.init();  // create collections if req'd. returns a promise
        controllers.agent.init();  // create collections if req'd. returns a promise

        /****************************
         * Start Master API Server
         */

//        passport.use(new ClientCertStrategy(function(clientCert, done) {
//          console.log('client cert:', clientCert);
//
//          done(null, {something: true});
//        }));

        /**
         * Express app for the Master API
         * @class appApi
         * @memberof App
         */
        var appApi = express(),
          optionsApi = {
            key: fs.readFileSync(ca.masterApiPrivateKeyFile),
            cert: fs.readFileSync(ca.masterApiCertFile),
            ca: [
              fs.readFileSync(ca.agentSignerCertFile, 'utf8'),
              fs.readFileSync(ca.intCertFile, 'utf8'),
              fs.readFileSync(ca.rootCertFile, 'utf8')
              // cert to verify agents

              /*
               * root cert placed in /usr/share/ca-certificates/partout and updated
               * /etc/ca-certificates.conf to point to it.
               * run update-ca-certificates
               * only include intermediate ca here, and import this into
               * browsers cert stores
               */
              //fs.readFileSync(ca.rootCertFile)
            ],
            requestCert: true,
            rejectUnauthorized: false
          };

        appApi.opts = opts;

//        appApi.use(passport.initialize());
//        appApi.use(passport.authenticate('client-cert', {session: false}));

        appApi.use(compression());
        routerApi.use(logger);
        appApi.use(bodyParser.json({limit: '50mb'}));
        appApi.use(bodyParser.urlencoded({ extended: true }));

        require('./lib/api/routes')(routerApi, cfg, db.getDb(), controllers, serverMetrics);

        appApi.use('/', routerApi);
        appApi.use(express.static('public'));

        httpsApi.createServer(optionsApi, appApi)
        .listen(cfg.partout_api_port);
        console.info('Master API listening on port', cfg.partout_api_port);

        /****************************
         * Start Master UI Server
         */

        /**
         * Express app for the Master UI
         * @class appUi
         * @memberof App
         */
        var appUi = express(),
          optionsUi = {
            key: fs.readFileSync(ca.masterUiPrivateKeyFile),
            cert: fs.readFileSync(ca.masterUiCertFile),
            ca: [
              fs.readFileSync(ca.intCertFile)

              /*
               * root cert placed in /usr/share/ca-certificates/partout and updated
               * /etc/ca-certificates.conf to point to it.
               * run update-ca-certificates
               * only include intermediate ca here, and import this into
               * browsers cert stores
               */
              //fs.readFileSync(ca.rootCertFile)
            ],
            requestCert: true,
            rejectUnauthorized: false
          };

        appUi.opts = opts;

        appUi.use(compression());
        routerUi.use(logger);
        appUi.use(bodyParser.json());
        appUi.use(bodyParser.urlencoded({ extended: true }));

        require('./lib/ui/routes')(routerUi, cfg, db.getDb(), controllers, serverMetrics);

        appUi.use('/', routerUi);
        appUi.use(express.static('public'));

        httpsUi.createServer(optionsUi, appUi)
        .listen(cfg.partout_ui_port);
        console.info('Master UI listening on port', cfg.partout_ui_port);

      }).done();
    });

  })
  .done();
};

module.exports = function (opts) {
  if (opts.init) {
    init(opts.args)
    .done();

  } else if (opts.serve) {
    serve(opts);

  } else if (opts.csr) {
    //console.log('csr args:', opts.args);

    db.connect()
    .then(function (status) {
      //console.log('csr db:', status);
      var csr = new Csr(db.getDb()),
          //agent = new Agent(db.getDb()),
          key;

      if (opts.args.length === 0) {
        opts.args[0] = 'list';
      }

      if (opts.args[0] === 'list') {  // partout csr list
        //console.log('in list');
        csr.all()
        .then(function (csrList) {
          //console.log('csrList:', csrList);

          csrList = _.sortBy(csrList, function (o) { return o.lastSeen; });

          //console.warn('CSRs:');
          for (var i in csrList) {
            var csrObj = ca.pki.certificationRequestFromPem(csrList[i].csr),
                fingerprint = ca.pki.getPublicKeyFingerprint(csrObj.publicKey, {encoding: 'hex', delimiter: ':'}),
                logrow = csrList[i]._key + ' : ' + csrList[i].status + ' : ' + fingerprint + ' : ' + csrList[i].lastSeen;

            if (csrList[i].status === 'unsigned') {
              console.warn(logrow);
            } else {
              console.info(logrow);
            }
          }
        })
        .fail(function (err) {
          console.error(err);
        })
        .done();

      } else if (opts.args[0] === 'sign') { // partout csr sign
        //console.log('args legnth:', opts.args.length);
        if (opts.args.length < 2) {
          console.error('Error: Missing csr key to sign');
          process.exit(1);
        }
        key = opts.args[1];
        console.warn('Signing csr for agent:', key);

        csr.query({_key: key})
        .then(function (cursor) {
          console.log('cursor:', cursor);
          if (cursor.count === 0) {
            console.error('csr not found');
            process.exit(1);
          } else if (cursor.count > 1) {
            console.error('Internal error, query for csr key returned more than 1 document');
            process.exit(1);
          } else {
            cursor.next()
            .then(function (csrDoc) {
              console.info('Signing CSR:\n', csrDoc.csr);
              ca.signCsrWithAgentSigner(csrDoc.csr, key)  // sign adding key/uuid as given name
              .then(function (signed) {
                console.log('Signed cert from csr:\n' + signed.certPem);

                // return to agent via the csr document in db
                csrDoc.cert = signed.cert;
                csrDoc.certPem = signed.certPem;
                csrDoc.status = 'signed';
                return csr.update(csrDoc);
              }).done();
            })
            .done();
          }
        })
        .done();

      } else if (opts.args[0].match(/^(reject|delete)$/)) { // partout csr reject ...
        if (opts.args.length < 2) {
          console.error('Error missing csr key to reject');
          process.exit(1);
        }
        key = opts.args[1];

        if (key === 'all') {
          console.warn('rejecting all csrs...');
          csr.deleteAll()
          .done();
        } else {
          console.warn('rejecting csr for agent:', key);

          csr.query({_key: key})
          .then(function (cursor) {
            if (cursor.count === 0) {
              console.error('csr not found');
              process.exit(1);
            } else if (cursor.count > 1) {
              console.error('Internal error, query for csr key returned more than 1 document');
              process.exit(1);
            } else {
              cursor.next()
              .then(function (csrDoc) {
                return csr.delete(csrDoc._key);
              })
              .done();
            }
          })
          .done();
        }

      } else {
        console.error('Error: Unrecognised sub command');
        process.exit(1);
      } // if args[0]

    })
    .done();

  } else if (opts.setenv) { // set agent environment
    // partout setenv uuid new-environment
    var uuid = opts.args[0],
        newenv = opts.args[1];

    db.connect()
    .then(function (status) {
      //console.log('csr db:', status);
      var agent = new Agent(db.getDb());

      agent.queryOne({_key: uuid})
      .then(function (doc) {
        if (!doc) {
          console.error('UUID', uuid, 'not found in agents collection');
          process.exit(1);
        }
        if (doc.environment !== newenv) {
          doc.env = newenv;
          return agent.update(doc);
        }
      })
      .done();
    })
    .done();

  } else if (opts.listagents) { // list agents
    db.connect()
    .then(function (status) {
      //console.log('csr db:', status);
      var agent = new Agent(db.getDb());
      return agent.all()
      .then(function (agents) {

        // Headers
        console.info(printf(
          '%-36s %-15s %s',
          'Agent UUID',
          'Environment',
          'Agent Cert Info'
        ));

        console.info(printf(
          '%36s %-15s %s',
          '='.repeat(36),
          '='.repeat(15),
          '='.repeat(80-(36+15))
        ));

        agents.forEach(function (a) {
          var c = (a.env ? console.info : console.warn);
          c(printf(
            '%-36s %-15s %s %s -> %s',
            a._key,
            a.env || 'n/a',
            (function () {
              var str = '';
              for (var i=0; i<2; i++) {
                var sattr = a.certInfo.subject.attributes[i];
                str += sattr.value + (i===0 ? '/' : '');
              }
              return str;
            })(),
            a.certInfo.valid_from || 'n/a',
            a.certInfo.valid_to || 'n/a'
          ));
        });
      });
    })
    .done();

  } else {
    console.error('Error: Unrecognised command');
    process.exit(1);
  }
};
