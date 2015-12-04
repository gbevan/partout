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
  keyFile = 'etc/ssl/server.key',
  certFile = 'etc/ssl/server.crt',
  os = require('os'),
  hostName = os.hostname(),
  ca = new (require('./lib/ca'))(),
  Q = require('q'),
  cfg = new (require('./etc/partout.conf.js'))(),
  arangojs = require('arangojs'),
  db = arangojs();

Q.longStackSupport = true;

/**
 * Partout application server
 */
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
.done(function() {
  console.log('Certificates ok, generating key chain');

  ca.generateTrustedCertChain(function () {
    console.log('trusted key chain done');

    console.log('starting Master API server.');

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
    console.warn(new Array(master_fingerprint.length + 1).join('='));
    console.warn('Master API SSL fingerprint (SHA256):\n' + master_fingerprint);
    console.warn(new Array(master_fingerprint.length + 1).join('='));


    var connectDb = function () {
      var deferred = Q.defer();
      // get list of databases
      db.listUserDatabases()
      .then(function (databases) {
        console.warn('list databases:', databases);

        // Test if db exists
        var dbExists = (databases.filter(function (d) {
          return d === cfg.database_name;
        }).length > 0);
        console.warn('db exists:', dbExists);

        if (!dbExists) {
          // Create the database
          db.createDatabase('partout')
          .then(function(info) {
            console.warn('create info:', info);
            deferred.resolve('created');
          });
        } else {
          deferred.resolve('opened');
        }
      });
      return deferred.promise;
    };
    connectDb()
    .then(function (status) {
      console.log('db:', status);

      /****************************
       * Connecting to database
       */
      var v = db.useDatabase(cfg.database_name);
      console.warn('v:', v);

      /****************************
       * Start Master API Server
       */
      var appApi = express(),
        optionsApi = {
          key: fs.readFileSync(ca.masterApiPrivateKeyFile),
          cert: fs.readFileSync(ca.masterApiCertFile),
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

      appApi.use(compression());

      routerApi.use(logger);

      appApi.use(bodyParser.json());
      appApi.use(bodyParser.urlencoded({ extended: true }));

      //router.use('/', routes);
      require('./lib/api/routes')(routerApi, cfg);

      appApi.use('/', routerApi);

      httpsApi.createServer(optionsApi, appApi)
      .listen(cfg.partout_api_port);

      /****************************
       * Start Master UI Server
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

      appUi.use(compression());

      routerUi.use(logger);

      appUi.use(bodyParser.json());
      appUi.use(bodyParser.urlencoded({ extended: true }));

      //router.use('/', routes);
      require('./lib/ui/routes')(routerUi);

      appUi.use('/', routerUi);

      httpsUi.createServer(optionsUi, appUi)
      .listen(cfg.partout_ui_port);

    });
  });

});
