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
  cfg = new (require('./etc/partout.conf.js'))();

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
