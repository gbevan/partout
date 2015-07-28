/*jslint node: true, vars: true*/
'use strict';

var express = require('express'),
  router = express.Router(),
  https = require('https'),
  pki = require('node-forge').pki,
  morgan = require('morgan'),
  logger = morgan('combined'),
  fs = require('fs'),
  keyFile = 'etc/ssl/server.key',
  certFile = 'etc/ssl/server.crt',
  sslKey,
  sslCert,
  os = require('os'),
  hostName = os.hostname(),
  Policy = require('./lib/policy'),
  Policy_Sync = require('./lib/policy_sync');

var apply = function (args) {
  var policy = new Policy(args);
  policy.apply();
};

var serve = function () {
  console.log('Serve');
  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    sslKey = fs.readFileSync(keyFile);
    sslCert = fs.readFileSync(certFile);
  } else {
    console.log('Generating self-signed cert');

    var keys = pki.rsa.generateKeyPair(2048),
      cert = pki.createCertificate();
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
      value: 'Partout Agent'
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
    ssl_options = {
      key: sslKey,
      cert: sslCert
    };

  app.master = '192.168.5.64';
  app.master_port = 10443;
  app.apply_every_mins = 0.1;
  app.apply_site_p2 = 'etc/manifest/site.p2';

  var policy_sync = new Policy_Sync(app, https);

  app.run = function () {
    policy_sync.sync('etc/manifest', function () {
      console.log('sync done');

      fs.exists(app.apply_site_p2, function (exists) {
        if (!exists) {
          console.error('Error: site policy file', app.apply_site_p2, 'does not yet exist');
        } else {
          console.log('applying');
          apply([app.apply_site_p2]);
        }
      });
    });
  };

  router.use(morgan('combined'));

  router.get('/', function (req, res, next) {
    res.send('Hello');
  });

  app.use('/', router);

  https.createServer(ssl_options, app)
    .listen(10444);

  app.run();
  setInterval(function () {
    app.run();
  }, (app.apply_every_mins * 60 * 1000));
};

module.exports = function (opts) {
  if (opts.apply) {
    apply(opts.args);

  } else if (opts.serve) {
    serve(opts.args);

  } else {
    throw new Error('Unrecognised directive:' + JSON.stringify(opts));
  }
};
