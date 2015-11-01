/*jslint node: true */
'use strict';

var expect = require('expect'),
  forge = require('node-forge'),
  pki = forge.pki;

/**
 * @constructor
 */
var Ssl = function () {
  var self = this;

};

// TODO: Change to genCsr()
/**
 * Generate an SSL Certificate
 * @param {Object} cfg
 * @param {String} cfg.serialNumber
 * @param {Number} cfg.maxAge in years
 * @param cfg.subjAttrs
 * @param cfg.issuerAttrs
 * @param cfg.extensions
 */
Ssl.prototype.gencert = function (cfg) {
  var self = this,
    cert = pki.createCertificate();

  expect(cfg).toNotBe(undefined, 'ERROR: no cfg object passed to ssl.gencert()');

  expect(cfg.serialNumber).toNotBe(undefined, 'ERROR: no cfg serialNumber passed to ssl.gencert()');
  expect(cfg.serialNumber).toMatch(/\d{2}/, 'ERROR: cfg serialNumber must be a string with 2 numbers');

  expect(cfg.maxAge).toNotBe(undefined, 'ERROR: no cfg maxAge passed to ssl.gencert()');
  expect(cfg.maxAge).toBeA('number', 'ERROR: cfg maxAge not number');

  expect(cfg.subjAttrs).toNotBe(undefined, 'ERROR: no cfg subjAttrs passed to ssl.gencert()');
  expect(cfg.subjAttrs).toBeA('object', 'ERROR: cfg subjAttrs must be a list');

  expect(cfg.issuerAttrs).toNotBe(undefined, 'ERROR: no cfg issuerAttrs passed to ssl.gencert()');
  expect(cfg.issuerAttrs).toBeA('object', 'ERROR: cfg issuerAttrs must be a list');

  expect(cfg.extensions).toNotBe(undefined, 'ERROR: no cfg extensions passed to ssl.gencert()');
  expect(cfg.extensions).toBeA('object', 'ERROR: cfg extensions must be a list');

  cert.serialNumber = cfg.serialNumber;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + cfg.maxAge
  );

  cert.setSubject(cfg.subjAttrs);
  cert.setIssuer(cfg.issuerAttrs);
  cert.setExtensions(cfg.extensions);

  return cert;
};


/**
 * Generate a server certificate signing request
 * @param {Object} cfg
 * @param {String} cfg.serialNumber
 * @param {Number} cfg.maxAge in years
 * @param cfg.subjAttrs
 * @param cfg.issuerAttrs
 */
Ssl.prototype.createMasterCsr = function (subjAttrs, cfg, keySize, pemIntCA) {
  var self = this;

  // XXX: FIX!
  cfg.extensions = [{
    name: 'basicConstraints',
    critical: true,
    cA: true,
    pathlen: 0
  }, {
    name: 'keyUsage',
    critical: true,
    digitalSignature: true,
    cRLSign: true,
    keyCertSign: true
    //nonRepudiation: true,
    //keyEncipherment: true,
    //dataEncipherment: true
  }, {
    name: 'subjectAltName',
    altNames: [{
      type: 7, // IP
      ip: '127.0.0.1'
    }]
  }];

  // Generate key pair
  var keys = pki.rsa.generateKeyPair((keySize ? keySize: 2048));

  // Create certificate request CSR
  var csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject(subjAttrs);
  //csr.setAttributes ?
  csr.sign(keys.privateKey, forge.md.sha256.create());
  console.log('csr:', csr);
  console.log('csr.subject:', csr.subject);
  console.log('csr.verify:', csr.verify());

  var privkey_pkcs = pki.wrapRsaPrivateKey(
    pki.privateKeyToAsn1(
      keys.privateKey
    )
  );

  /*
  var privkey_enc = pki.encryptedPrivateKeyToPem(
    pki.encryptPrivateKeyInfo(
      privkey_pkcs,
      'password',
      {algorithm: 'aes256'} // 'aes128', 'aes192', 'aes256', '3des'
    )
  );
  console.log('privkey_enc:', privkey_enc);
  */


  /*
  var cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + 1
  );

  cert.setSubject(csr.subject.attributes);
  cert.setIssuer(pemIntCA.certObj.subject.attributes);
  cert.setExtensions(cfg.extensions);
  console.log('cert:', cert);
  cert.sign(pemIntCA.privateKey, forge.md.sha256.create());
  //console.log('cert.verify:', cert.verify());
  */

  var pem = {
    'private': forge.pki.certificationRequestToPem(csr),
    'public': pki.publicKeyToPem(keys.publicKey),
    'cert': pki.certificateToPem(cert),
    'csr': forge.pki.certificationRequestToPem(csr),
    'certObj': cert,
    'certChain': pki.certificateToPem(cert) + pemIntCA.cert
  };
  return pem;
};

module.exports = Ssl;
