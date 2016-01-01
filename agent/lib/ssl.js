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

var expect = require('expect'),
  forge = require('node-forge'),
  path = require('path'),
  pki = forge.pki,
  fs = require('fs'),
  Q = require('q'),
  utils = new (require('../lib/utils'))();

/**
 * @constructor
 */
var Ssl = function (cfg) {
  var self = this;

  self.PARTOUT_AGENT_SSL_DIR = cfg.PARTOUT_AGENT_SSL_DIR;
  self.PARTOUT_SSL_AGENT_PREFIX = 'agent';

  self.setFileNames();
};

Ssl.prototype.setFileNames = function () {
  var self = this;

  /******************
   * Agent Files
   */
  self.agentCsrFile = path.join(
    self.PARTOUT_AGENT_SSL_DIR,
    self.PARTOUT_SSL_AGENT_PREFIX
  ) + '.csr';

  self.agentCertFile = path.join(
    self.PARTOUT_AGENT_SSL_DIR,
    self.PARTOUT_SSL_AGENT_PREFIX
  ) + '.crt';

  self.agentPrivateKeyFile = path.join(
    self.PARTOUT_AGENT_SSL_DIR,
    self.PARTOUT_SSL_AGENT_PREFIX
  ) + '.private.key.pem';

  self.agentPublicKeyFile = path.join(
    self.PARTOUT_AGENT_SSL_DIR,
    self.PARTOUT_SSL_AGENT_PREFIX
  ) + '.public.key.pem';

};

/**
 * Set SSL Directory for certificates
 * @param {String} directory path, e.g. /etc/ssl
 */
Ssl.prototype.setSslDir = function (dir) {
  var self = this;
  self.PARTOUT_AGENT_SSL_DIR = dir;
  self.setFileNames();
};

/**
 * Get SSL Directory for certificates
 * @returns {String} directory path, e.g. /etc/ssl
 */
Ssl.prototype.getSslDir = function (dir) {
  var self = this;
  return self.PARTOUT_AGENT_SSL_DIR;
};

/**
 * Set SSL Agent file prefix
 * @param {String} prefix, e.g. 'agent.'
 */
Ssl.prototype.setSslAgentPrefix = function (p) {
  var self = this;
  self.PARTOUT_SSL_AGENT_PREFIX = p;
  self.setFileNames();
};

/**
 * Get SSL Agent Signer file prefix
 * @param {String} prefix, e.g. 'agentsigner.'
 */
Ssl.prototype.getSslAgentPrefix = function (p) {
  var self = this;
  return self.PARTOUT_SSL_AGENT_PREFIX;
};



/*
 * Generate an SSL Certificate
 * @param {Object} cfg
 * @param {Object} cfg.subjAttrs
 * @param {Object} cfg.extensions
 * @param {int}    cfg.keySize
 *
 * @param {Function} callback (err, csr, fingerprint)
 */
Ssl.prototype.genCsr = function (cfg, cb) {
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
  Q.nfcall(utils.ensurePath, path.dirname(self.agentCsrFile))
  .then(function () {
    // create CA Root Cert Pem file
    return Q.nfcall(fs.writeFile, self.agentCsrFile, csr_pem);
  })
  .then(function () {
    // create CA Root Private Key Pem file
    return Q.nfcall(fs.writeFile, self.agentPrivateKeyFile, keys_pem.private, { mode: parseInt('0600', 8) });
  })
  .then(function () {
    // create CA Root Public Key Pem file
    return Q.nfcall(fs.writeFile, self.agentPublicKeyFile, keys_pem.public);
  })
  .then(function () {
    cb(undefined, csr, pki.getPublicKeyFingerprint(csr.publicKey, {encoding: 'hex', delimiter: ':'}));
  })
  .fail(function (err) {
    console.log('fail err:', err);
    console.log(err.stack);
    process.nextTick(function () { cb(err); });
  });

  return csr;
};

module.exports = Ssl;
