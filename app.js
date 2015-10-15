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
  morgan = require('morgan'),
  logger = morgan('combined'),
  compression = require('compression'),
  fs = require('fs'),
  keyFile = 'etc/ssl/server.key',
  certFile = 'etc/ssl/server.crt',
  os = require('os'),
  hostName = os.hostname(),
  ca = new (require('./lib/ca'))(),
  Q = require('q');

Q.longStackSupport = true;

/**
 * Partout application server
 */

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
        ]
      };

    appApi.use(compression());

    routerApi.use(morgan('combined'));

    appApi.use(bodyParser.json());
    appApi.use(bodyParser.urlencoded({ extended: true }));

    //router.use('/', routes);
    require('./lib/api/routes')(routerApi);

    appApi.use('/', routerApi);

    httpsApi.createServer(optionsApi, appApi)
      .listen(10443);

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
        ]
      };

    appUi.use(compression());

    routerUi.use(morgan('combined'));

    appUi.use(bodyParser.json());
    appUi.use(bodyParser.urlencoded({ extended: true }));

    //router.use('/', routes);
    require('./lib/ui/routes')(routerUi);

    appUi.use('/', routerUi);

    httpsUi.createServer(optionsUi, appUi)
      .listen(11443);

  });

});
