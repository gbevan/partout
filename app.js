/*jslint node: true */
'use strict';

var console = require('better-console'),
  express = require('express'),
  router = express.Router(),
  https = require('https'),
  bodyParser = require('body-parser'),
  pki = require('node-forge').pki,
  morgan = require('morgan'),
  logger = morgan('combined'),
  compression = require('compression'),
  fs = require('fs'),
  keyFile = 'etc/ssl/server.key',
  certFile = 'etc/ssl/server.crt',
  sslKey,
  sslCert,
  os = require('os'),
  hostName = os.hostname();

//console.log('hostname:', hostName);

/**
 * Partout application server
 */

if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
  sslKey = fs.readFileSync(keyFile);
  sslCert = fs.readFileSync(certFile);
} else {
  console.log('Generating self-signed cert');

  var keys = pki.rsa.generateKeyPair(2048);
  //console.log('keys:', keys);

  var cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 30);
  var attrs = [{
    name: 'commonName',
    value: hostName
  }, {
    shortName: 'OU',
    value: 'Partout'
  }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  // cert.setExtensions...?
  cert.setExtensions([{
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }, {
    name: 'subjectAltName',
    altNames: [{
      type: 6, // URI
      value: 'http://example.org/webid#me'
    }]
  }]);

  cert.publicKey = keys.publicKey;

  cert.sign(keys.privateKey);
  //console.log('cert:', cert);

  var pem = {
    'private': pki.privateKeyToPem(keys.privateKey),
    'public': pki.publicKeyToPem(keys.publicKey),
    'cert': pki.certificateToPem(cert)
  };

  //console.log('pem:', pem);

  sslKey = pem['private'];
  sslCert = pem.cert;
  fs.writeFileSync(keyFile, sslKey);
  fs.writeFileSync(certFile, sslCert);
}

//console.log(pems);
// TODO: Move new cert into mongodb to make permanent

var app = express(),
  options = {
    key: sslKey,
    cert: sslCert
  };

app.use(compression());

router.use(morgan('combined'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//router.use('/', routes);
require('./lib/routes')(router);

app.use('/', router);

https.createServer(options, app)
  .listen(10443);
