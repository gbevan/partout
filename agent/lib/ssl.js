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

/*
 * Generate an SSL Certificate
 * @param {Object} cfg
 * @param {Object} cfg.subjAttrs
 * @param {Object} cfg.extensions
 * @param {int}    cfg.keySize
 */
Ssl.prototype.genCsr = function (cfg) {
  var self = this,
    keys = pki.rsa.generateKeyPair((cfg.keySize || 2048)),
    csr = pki.createCertificationRequest();

  expect(cfg).toNotBe(undefined, 'ERROR: no cfg object passed to ssl.genCsr()');

  //expect(cfg.serialNumber).toNotBe(undefined, 'ERROR: no cfg serialNumber passed to ssl.genCsr()');
  //expect(cfg.serialNumber).toMatch(/\d{2}/, 'ERROR: cfg serialNumber must be a string with 2 numbers');

  //expect(cfg.maxAge).toNotBe(undefined, 'ERROR: no cfg maxAge passed to ssl.genCsr()');
  //expect(cfg.maxAge).toBeA('number', 'ERROR: cfg maxAge not number');

  expect(cfg.subjAttrs).toNotBe(undefined, 'ERROR: no cfg subjAttrs passed to ssl.genCsr()');
  expect(cfg.subjAttrs).toBeA('object', 'ERROR: cfg subjAttrs must be a list');

  //expect(cfg.issuerAttrs).toNotBe(undefined, 'ERROR: no cfg issuerAttrs passed to ssl.genCsr()');
  //expect(cfg.issuerAttrs).toBeA('object', 'ERROR: cfg issuerAttrs must be a list');

  //expect(cfg.extensions).toNotBe(undefined, 'ERROR: no cfg extensions passed to ssl.genCsr()');
  //expect(cfg.extensions).toBeA('object', 'ERROR: cfg extensions must be a list');

  //csr.serialNumber = cfg.serialNumber;
  //csr.validity.notBefore = new Date();
  //csr.validity.notAfter = new Date();
  //csr.validity.notAfter.setFullYear(
  //  csr.validity.notBefore.getFullYear() + cfg.maxAge
  //);

  csr.publicKey = keys.publicKey;
  csr.setSubject(cfg.subjAttrs);

  if (cfg.extensions) {
    csr.setExtensions(cfg.extensions);
  }
  //console.log('keys:', keys.privateKey);

  csr.sign(keys.privateKey, forge.md.sha256.create());

  var csr_pem = pki.certificationRequestToPem(csr),
    keys_pem = {
      'private': pki.privateKeyToPem(keys.privateKey),
      'public': pki.publicKeyToPem(keys.publicKey)
    };

  // save agent keys


  return csr;
};

module.exports = Ssl;
