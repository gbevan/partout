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

/*global PARTOUT_SSL_DIR, PARTOUT_SSL_CA_PREFIX */

var expect = require('expect'),
  forge = require('node-forge'),
  pki = forge.pki,
  fs = require('fs'),
  prompt = require('prompt'),
  path = require('path'),
  CACFG = require('../etc/CA.js'),
  pfs = require('../agent/lib/pfs'),
  Q = require('q');

/**
 * @constructor
 */
var Ca = function () {
  var self = this;

  self.pki = pki;

  self.ca_config = new CACFG();
  //console.log('ca_config:', self.ca_config);

  // Defaults
  self.PARTOUT_SSL_DIR = './etc/ssl';
  self.PARTOUT_SSL_CA_PREFIX = 'root_ca';
  self.PARTOUT_SSL_INTERMEDIATE_CA_PREFIX = 'intermediate_ca';
  self.PARTOUT_SSL_AGENTSIGNER_PREFIX = 'agentsigner';
  self.PARTOUT_SSL_MASTERAPI_PREFIX = 'masterapi';
  self.PARTOUT_SSL_MASTERUI_PREFIX = 'masterui';
  self.PARTOUT_SSL_TRUSTED_CERT_CHAIN = 'trusted_cert_chain';

  self.PARTOUT_SSL_PUBLIC = './etc/ssl_public';
  self.PARTOUT_AGENT_SSL_PUBLIC = './agent/etc/ssl_public';

  self.setFileNames();

};

Ca.prototype.setFileNames = function () {
  var self = this;

  /*************************
   * Root CA Files
   */
  self.rootCertFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_CA_PREFIX
  ) + '.crt';

  self.rootPrivateKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_CA_PREFIX
  ) + '.private.key.pem';

  self.rootPublicKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_CA_PREFIX
  ) + '.public.key.pem';

  /*************************
   * Intermediate CA Files
   */
  self.intCertFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_INTERMEDIATE_CA_PREFIX
  ) + '.crt';

  self.intPrivateKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_INTERMEDIATE_CA_PREFIX
  ) + '.private.key.pem';

  self.intPublicKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_INTERMEDIATE_CA_PREFIX
  ) + '.public.key.pem';

  /*************************
   * Agent Signer Files
   */
  self.agentSignerCertFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_AGENTSIGNER_PREFIX
  ) + '.crt';

  self.agentSignerPrivateKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_AGENTSIGNER_PREFIX
  ) + '.private.key.pem';

  self.agentSignerPublicKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_AGENTSIGNER_PREFIX
  ) + '.public.key.pem';

  /*************************
   * Master API Files
   */
  self.masterApiCertFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_MASTERAPI_PREFIX
  ) + '.crt';

  self.masterApiPrivateKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_MASTERAPI_PREFIX
  ) + '.private.key.pem';

  self.masterApiPublicKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_MASTERAPI_PREFIX
  ) + '.public.key.pem';

  /*************************
   * Master UI Files
   */
  self.masterUiCertFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_MASTERUI_PREFIX
  ) + '.crt';

  self.masterUiPrivateKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_MASTERUI_PREFIX
  ) + '.private.key.pem';

  self.masterUiPublicKeyFile = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_MASTERUI_PREFIX
  ) + '.public.key.pem';

  /*************************
   * Trusted Certificate Chain
   */
  self.trustedCertChain = path.join(
    self.PARTOUT_SSL_DIR,
    self.PARTOUT_SSL_TRUSTED_CERT_CHAIN
  ) + '.crt';

};

/**
 * Set SSL Directory for certificates
 * @param {String} directory path, e.g. /etc/ssl
 */
Ca.prototype.setSslDir = function (dir) {
  var self = this;
  self.PARTOUT_SSL_DIR = dir;
  self.setFileNames();
};

/**
 * Get SSL Directory for certificates
 * @returns {String} directory path, e.g. /etc/ssl
 */
Ca.prototype.getSslDir = function (dir) {
  var self = this;
  return self.PARTOUT_SSL_DIR;
};

/**
 * Set SSL CA file prefix
 * @param {String} prefix, e.g. 'root.ca.'
 */
Ca.prototype.setSslCaPrefix = function (p) {
  var self = this;
  self.PARTOUT_SSL_CA_PREFIX = p;
  self.setFileNames();
};

/**
 * Get SSL CA file prefix
 * @returns {String} prefix, e.g. 'root.ca.'
 */
Ca.prototype.getSslCaPrefix = function (p) {
  var self = this;
  return self.PARTOUT_SSL_CA_PREFIX;
};

/**
 * Set SSL Intermediate CA file prefix
 * @param {String} prefix, e.g. 'int.ca.'
 */
Ca.prototype.setSslIntCaPrefix = function (p) {
  var self = this;
  self.PARTOUT_SSL_INTERMEDIATE_CA_PREFIX = p;
  self.setFileNames();
};

/**
 * Get SSL Intermediate CA file prefix
 * @param {String} prefix, e.g. 'int.ca.'
 */
Ca.prototype.getSslIntCaPrefix = function (p) {
  var self = this;
  return self.PARTOUT_SSL_INTERMEDIATE_CA_PREFIX;
};

/**
 * Set SSL Agent Signer file prefix
 * @param {String} prefix, e.g. 'agentsigner.'
 */
Ca.prototype.setSslAgentSignerPrefix = function (p) {
  var self = this;
  self.PARTOUT_SSL_AGENTSIGNER_PREFIX = p;
  self.setFileNames();
};

/**
 * Get SSL Agent Signer file prefix
 * @param {String} prefix, e.g. 'agentsigner.'
 */
Ca.prototype.getSslAgentSignerPrefix = function (p) {
  var self = this;
  return self.PARTOUT_SSL_AGENTSIGNER_PREFIX;
};

/**
 * Set SSL Master API file prefix
 * @param {String} prefix, e.g. 'masterapi.'
 */
Ca.prototype.setSslMasterApiPrefix = function (p) {
  var self = this;
  self.PARTOUT_SSL_MASTERAPI_PREFIX = p;
  self.setFileNames();
};

/**
 * Get SSL Master API file prefix
 * @param {String} prefix, e.g. 'masterapi.'
 */
Ca.prototype.getSslMasterApiPrefix = function (p) {
  var self = this;
  return self.PARTOUT_SSL_MASTERAPI_PREFIX;
};

/**
 * Set SSL Master UI file prefix
 * @param {String} prefix, e.g. 'masterui.'
 */
Ca.prototype.setSslMasterUiPrefix = function (p) {
  var self = this;
  self.PARTOUT_SSL_MASTERUI_PREFIX = p;
  self.setFileNames();
};

/**
 * Get SSL Master UI file prefix
 * @param {String} prefix, e.g. 'masterui.'
 */
Ca.prototype.getSslMasterUiPrefix = function (p) {
  var self = this;
  return self.PARTOUT_SSL_MASTERUI_PREFIX;
};


/**
 * generic check for existing Certificate
 * @param {String} label for new cert prompts
 * @param {String} new certificate file name
 * @param {String} new private key file name
 * @param {String} new public key file name
 * @param {Function} create certificate function
 * @param {Object} signer details. { label: 'CA Root' } for {} for self-signed
 * @param {Boolean} pass phrase is required for this new cert's private key
 * @param {Function} callback (err, cert)
 */
Ca.prototype.checkCert = function (label, certFile, privateKeyFile, publicKeyFile, createFunc, signer, passphraseRequired, cb) {
  var self = this;
  //console.log('self in checkCert:', self);

  if (typeof(passphraseRequired) === 'function') {
    cb = passphraseRequired;
    passphraseRequired = true;
  }

  // check if cert exists
  Q.all([
    pfs.pExists(certFile),
    pfs.pExists(privateKeyFile),
    pfs.pExists(publicKeyFile)
  ])
  .then(function (results) {
    //console.log('results:', results);
    // any results false?
    if (results.filter(function (r) { return !r; }).length > 0) {
      // if not, create self signed cert
      prompt.start();
      Q.nfcall(prompt.get, [{
        name: 'yn',
        message: label + ' Certificate missing, generate? (y/n)',
        validator: /^(y|n)$/,
        warning: 'enter y or n',
        required: true,
        hidden: true
      }])
      .then(function (ynres) {
        //console.log('answer:', ynres.yn);
        if (ynres.yn !== 'y') {
          throw (new Error(label + ' Certificate missing'));
        }

        var deferred_for_pass = Q.defer();
        if (passphraseRequired) {
          return Q.nfcall(prompt.get, {
            properties: {
              passphrase: {
                description: 'Enter new ' + label + ' Pass Phrase',
                required: true,
                hidden: true
              }
            }
          });
        } else {
          deferred_for_pass.resolve();
        }
        return deferred_for_pass.promise;
      })
      // if signer, then prompt label for signer passphrase
      .then(function (newpass) {
        var deferred = Q.defer();
        //console.log('signer:', signer);
        if (signer.label) {
          Q.nfcall(prompt.get, {
            properties: {
              passphrase: {
                description: 'Enter ' + signer.label + ' Pass Phrase',
                required: true,
                hidden: true
              }
            }
          })
          .then(function (res) {
            //console.log('newpass:', newpass, 'res:', res);
            deferred.resolve({newpass: newpass, signerpass: res});
          });
        } else {
          deferred.resolve({newpass: newpass, signerpass: null});
        }
        return deferred.promise;
      })
      .then(function (obj) {
        var newpass = obj.newpass,
          signerpass = obj.signerpass;

        //console.log('newpass:', newpass, 'signerpass:', signerpass);
        //console.log('Generating ' + label + ' Certificate...');

        // install cert
        //console.log('before createFunc self:', self);
        //console.log('before createFunc this:', this);

        // create args for createFunc
        var args = [];
        if (signerpass) {
          args.push(signerpass.passphrase);
        }
        if (newpass) {
          args.push(newpass.passphrase);
        }
        args.push(function (err) {
          if (err) {
            throw (err);
          }
          cb();
        });
        createFunc.apply(self, args);

      })
      .fail(function (err) {
        console.error(err);
        console.error(err.stack);
        throw (err);
      });

    } else {
      process.nextTick(cb);
    }
  })
  .fail(function (err) {
    console.error(err);
    console.error(err.stack);
    throw (err);
  });
};


/**
 * check for existing Root Certificate
 * @param {Function} callback (err, cert)
 */
Ca.prototype.createRootCert = function (passphrase, cb) {
  //console.log('parms:', passphrase, cb);
  //console.log('this:', this);
  var self = this,
    cfg = {
      serialNumber: self.ca_config.ca_root.serialNumber,
      maxAge: self.ca_config.ca_root.maxAge,
      subjAttrs: self.ca_config.ca_root.attrs,
      issuerAttrs: self.ca_config.ca_root.attrs,
      extensions: [{
        name: 'basicConstraints',
        critical: true,
        cA: true
      }, {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        cRLSign: true,
        keyCertSign: true
        //nonRepudiation: true,
        //keyEncipherment: true,
        //dataEncipherment: true
      //}, {
      //  name: 'subjectKeyIdentifier'
      }]
    },
    keys = pki.rsa.generateKeyPair(self.ca_config.ca_root.keySize),
    cert = pki.createCertificate(),
    err;

  //console.log('ca cfg:', cfg);

  cert.serialNumber = cfg.serialNumber;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + cfg.maxAge
  );

  cert.setSubject(cfg.subjAttrs);
  cert.setIssuer(cfg.issuerAttrs);
  cert.setExtensions(cfg.extensions);

  cert.publicKey = keys.publicKey;
  cert.sign(keys.privateKey, forge.md.sha256.create());

  var cert_pem = pki.certificateToPem(cert);

  var privkey_pkcs = pki.wrapRsaPrivateKey(
    pki.privateKeyToAsn1(
      keys.privateKey
    )
  );

  var keys_pem = {
    'private': pki.encryptedPrivateKeyToPem(
      pki.encryptPrivateKeyInfo(
        privkey_pkcs,
        passphrase,
        {algorithm: 'aes256'} // 'aes128', 'aes192', 'aes256', '3des'
      )
    ),
    'public': pki.publicKeyToPem(keys.publicKey),
    //'cert': pki.certificateToPem(cert),
    //'certObj': cert,
    //'privateKey': keys.privateKey // XXX: BAD!!!
  };

  Q.nfcall(pfs.ensurePath, path.dirname(self.rootCertFile))
  .then(function () {
    // create CA Root Cert Pem file
    return Q.nfcall(fs.writeFile, self.rootCertFile, cert_pem);
  })
  .then(function () {
    // create CA Root Private Key Pem file
    return Q.nfcall(fs.writeFile, self.rootPrivateKeyFile, keys_pem.private, { mode: parseInt('0600', 8) });
  })
  .then(function () {
    // create CA Root Public Key Pem file
    return Q.nfcall(fs.writeFile, self.rootPublicKeyFile, keys_pem.public);
  })
  .then(function () {
    cb(undefined, cert, keys_pem);
  })
  .fail(function (err) {
    console.log('fail err:', err);
    console.log(err.stack);
    process.nextTick(function () { cb(err); });
  });
};

/**
 * check for existing Root Certificate
 * @param {Function} callback (err, cert)
 */
Ca.prototype.checkRootCert = function (cb) {
  var self = this;

  self.checkCert(
    'CA Root',
    self.rootCertFile,
    self.rootPrivateKeyFile,
    self.rootPublicKeyFile,
    self.createRootCert,
    {}, // self-signed
    true, // passphrase is required
    cb
  );

};


/**
 * create intermediate CA signing certificate
 * @param {String} pass phrase for Root CA Private key
 * @param {String} pass phrase for new Intermediate CA Private key
 * @param {Function} callback (err, cert, pem)
 */
Ca.prototype.createIntermediateCert = function (rootpassphrase, passphrase, cb) {
  var self = this,
    cfg = {
      serialNumber: self.ca_config.ca_int.serialNumber,
      maxAge: self.ca_config.ca_int.maxAge,
      subjAttrs: self.ca_config.ca_int.attrs,
      issuerAttrs: self.ca_config.ca_root.attrs,
      extensions: [{
        name: 'basicConstraints',
        critical: true,
        cA: true,
        pathlen: 1
      }, {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        cRLSign: true,
        keyCertSign: true
        //nonRepudiation: true,
        //keyEncipherment: true,
        //dataEncipherment: true
      //}, {
      //  name: 'subjectKeyIdentifier'
      }]
    },
    keys = pki.rsa.generateKeyPair(self.ca_config.ca_int.keySize),
    cert = pki.createCertificate(),
    err;

  //console.log('int ca cfg:', cfg);

  cert.serialNumber = cfg.serialNumber;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + cfg.maxAge
  );

  cert.setSubject(cfg.subjAttrs);
  cert.setIssuer(cfg.issuerAttrs);
  cert.setExtensions(cfg.extensions);

  cert.publicKey = keys.publicKey;

  // Read and decrypt the Root CA Private key
  //console.log('before nfcall');
  Q.nfcall(fs.readFile, self.rootPrivateKeyFile)
  .then(function (encRootPem) {
    //console.log('encRootPem:', encRootPem);
    //console.log('encRootPem Buffer?:', Buffer.isBuffer(encRootPem));
    //console.log('rootpassphrase:', rootpassphrase);
    var rootKey;
    try {
      rootKey = pki.decryptRsaPrivateKey(encRootPem.toString(), rootpassphrase);
    } catch (e) {
      console.log(e.stack);
      throw (new Error('Failed to decrypt private key: ' + e));
    }

    cert.sign(rootKey, forge.md.sha256.create());
    rootKey = undefined;

    var cert_pem = pki.certificateToPem(cert);

    var privkey_pkcs = pki.wrapRsaPrivateKey(
      pki.privateKeyToAsn1(
        keys.privateKey
      )
    );

    var keys_pem = {
      'private': pki.encryptedPrivateKeyToPem(
        pki.encryptPrivateKeyInfo(
          privkey_pkcs,
          passphrase,
          {algorithm: 'aes256'} // 'aes128', 'aes192', 'aes256', '3des'
        )
      ),
      'public': pki.publicKeyToPem(keys.publicKey),
      //'cert': pki.certificateToPem(cert),
      //'certObj': cert,
      //'privateKey': keys.privateKey // XXX: BAD!!!
    };

    Q.nfcall(pfs.ensurePath, path.dirname(self.intCertFile))
    .then(function () {
      // create CA Root Cert Pem file
      return Q.nfcall(fs.writeFile, self.intCertFile, cert_pem);
    })
    .then(function () {
      // create CA Root Private Key Pem file
      return Q.nfcall(fs.writeFile, self.intPrivateKeyFile, keys_pem.private, { mode: parseInt('0600', 8) });
    })
    .then(function () {
      // create CA Root Public Key Pem file
      return Q.nfcall(fs.writeFile, self.intPublicKeyFile, keys_pem.public);
    })
    .done(
      function () {
        //console.log('calling cb');
        cb(undefined, cert, keys_pem);
      },
      function (err) {
        console.log('rejected err:', err);
        cb(err);
      }
    );
  })
  .fail(function (err) {
    console.log('fail err:', err);
    console.log(err.stack);
    process.nextTick(function () { cb(err); });
  });
};

Ca.prototype.checkIntermediateCert = function (cb) {
  var self = this;

  self.checkRootCert(function () {
    self.checkCert(
      'CA Intermediate',
      self.intCertFile,
      self.intPrivateKeyFile,
      self.intPublicKeyFile,
      self.createIntermediateCert,
      { label: 'CA Root' },
      true, // passphrase is required
      cb
    );
  });

};

/**
 * create Agent signer certificate
 * @param {String} pass phrase for Intermediate CA Private key
 * @param {String} pass phrase for new Agent Signer Private key
 * @param {Function} callback (err, cert, pem)
 */
Ca.prototype.createAgentSignerCert = function (intpassphrase, cb) {
  var self = this,
    cfg = {
      serialNumber: self.ca_config.agentsigner.serialNumber,
      maxAge: self.ca_config.agentsigner.maxAge,
      subjAttrs: self.ca_config.agentsigner.attrs,
      issuerAttrs: self.ca_config.ca_int.attrs,
      extensions: [{
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
      //}, {
      //  name: 'subjectKeyIdentifier'
      }]
    },
    keys = pki.rsa.generateKeyPair(self.ca_config.agentsigner.keySize),
    cert = pki.createCertificate(),
    err;

  //console.log('agentsigner cfg:', cfg);

  cert.serialNumber = cfg.serialNumber;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + cfg.maxAge
  );

  cert.setSubject(cfg.subjAttrs);
  cert.setIssuer(cfg.issuerAttrs);
  cert.setExtensions(cfg.extensions);

  cert.publicKey = keys.publicKey;

  // Read and decrypt the Root CA Private key
  //console.log('before nfcall');
  Q.nfcall(fs.readFile, self.intPrivateKeyFile)
  .then(function (encPem) {
    //console.log('encPem:', encPem);
    var rootKey;

    try {
      rootKey = pki.decryptRsaPrivateKey(encPem, intpassphrase);
    } catch (e) {
      throw (new Error('Failed to decrypt private key'));
    }
    //console.log('rootKey:', typeof(rootKey));

    cert.sign(rootKey, forge.md.sha256.create());
    rootKey = undefined;

    var cert_pem = pki.certificateToPem(cert);

    var privkey_pkcs = pki.wrapRsaPrivateKey(
      pki.privateKeyToAsn1(
        keys.privateKey
      )
    );

    var keys_pem = {
      'private': pki.privateKeyInfoToPem(privkey_pkcs),
      'public': pki.publicKeyToPem(keys.publicKey),
      //'cert': pki.certificateToPem(cert),
      //'certObj': cert,
      //'privateKey': keys.privateKey // XXX: BAD!!!
    };

    Q.nfcall(pfs.ensurePath, path.dirname(self.agentSignerCertFile))
    .then(function () {
      // create CA Root Cert Pem file
      return Q.nfcall(fs.writeFile, self.agentSignerCertFile, cert_pem);
    })
    .then(function () {
      // create CA Root Private Key Pem file
      return Q.nfcall(fs.writeFile, self.agentSignerPrivateKeyFile, keys_pem.private, { mode: parseInt('0600', 8) });
    })
    .then(function () {
      // create CA Root Public Key Pem file
      return Q.nfcall(fs.writeFile, self.agentSignerPublicKeyFile, keys_pem.public);
    })
    .done(
      function () {
        //console.log('calling cb with cert');
        cb(undefined, cert, keys_pem);
      },
      function (err) {
        console.log('rejected err:', err);
        cb(err);
      }
    );
  })
  .fail(function (err) {
    console.log('fail err:', err);
    console.log(err.stack);
    process.nextTick(function () { cb(err); });
  });
};


Ca.prototype.checkAgentSignerCert = function (cb) {
  var self = this;

  self.checkIntermediateCert(function () {
    self.checkCert(
      'Agent Signer',
      self.agentSignerCertFile,
      self.agentSignerPrivateKeyFile,
      self.agentSignerPublicKeyFile,
      self.createAgentSignerCert,
      { label: 'CA Intermediate' },
      false, // passphrase is not required
      cb
    );
  });

};

/**
 * create Master API certificate
 * @param {String} pass phrase for Intermediate CA Private key
 * @param {Function} callback (err, cert, pem)
 */
Ca.prototype.createMasterApiCert = function (intpassphrase, cb) {
  //console.log('this:', this);
  var self = this,
    cfg = {
      serialNumber: self.ca_config.masterapi.serialNumber,
      maxAge: self.ca_config.masterapi.maxAge,
      subjAttrs: self.ca_config.masterapi.attrs,
      issuerAttrs: self.ca_config.ca_int.attrs,
      extensions: [{
        name: 'basicConstraints',
        critical: true,
        cA: false
      }, {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true
      //}, {
      //  name: 'subjectKeyIdentifier'
      }]
    },
    keys = pki.rsa.generateKeyPair(self.ca_config.masterapi.keySize),
    cert = pki.createCertificate(),
    err;

  //console.log('masterapi cfg:', cfg);

  cert.serialNumber = cfg.serialNumber;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + cfg.maxAge
  );

  cert.setSubject(cfg.subjAttrs);
  cert.setIssuer(cfg.issuerAttrs);
  cert.setExtensions(cfg.extensions);

  cert.publicKey = keys.publicKey;

  // Read and decrypt the Root CA Private key
  //console.log('before nfcall');
  Q.nfcall(fs.readFile, self.intPrivateKeyFile)
  .then(function (encPem) {
    //console.log('encPem:', encPem);
    var rootKey;

    try {
      rootKey = pki.decryptRsaPrivateKey(encPem, intpassphrase);
    } catch (e) {
      throw (new Error('Failed to decrypt private key'));
    }

    //console.log('rootKey:', typeof(rootKey));

    cert.sign(rootKey, forge.md.sha256.create());
    rootKey = undefined;

    var cert_pem = pki.certificateToPem(cert);

    var privkey_pkcs = pki.wrapRsaPrivateKey(
      pki.privateKeyToAsn1(
        keys.privateKey
      )
    );
    //console.log('privkey_pkcs:', privkey_pkcs);

    var keys_pem = {
      'private': pki.privateKeyInfoToPem(privkey_pkcs),
      'public': pki.publicKeyToPem(keys.publicKey),
    };

    Q.nfcall(pfs.ensurePath, path.dirname(self.masterApiCertFile))
    .then(function () {
      // create CA Root Cert Pem file
      return Q.nfcall(fs.writeFile, self.masterApiCertFile, cert_pem);
    })
    .then(function () {
      // create CA Root Private Key Pem file
      return Q.nfcall(fs.writeFile, self.masterApiPrivateKeyFile, keys_pem.private, { mode: parseInt('0600', 8) });
    })
    .then(function () {
      // create CA Root Public Key Pem file
      return Q.nfcall(fs.writeFile, self.masterApiPublicKeyFile, keys_pem.public);
    })
    .done(
      function () {
        //console.log('calling cb with cert');
        cb(undefined, cert, keys_pem);
      },
      function (err) {
        console.log('rejected err:', err);
        cb(err);
      }
    );
  })
  .fail(function (err) {
    console.log('fail err:', err);
    console.log(err.stack);
    process.nextTick(function () { cb(err); });
  });
};


Ca.prototype.checkMasterApiCert = function (cb) {
  var self = this;
  //console.log('self:', self);

  self.checkIntermediateCert(function () {
    self.checkCert(
      'Master API',
      self.masterApiCertFile,
      self.masterApiPrivateKeyFile,
      self.masterApiPublicKeyFile,
      self.createMasterApiCert,
      { label: 'CA Intermediate' },
      false, // passphrase is not required
      cb
    );
  });

};

/**
 * create Master UI certificate
 * @param {String} pass phrase for Intermediate CA Private key
 * @param {Function} callback (err, cert, pem)
 */
Ca.prototype.createMasterUiCert = function (intpassphrase, cb) {
  var self = this,
    cfg = {
      serialNumber: self.ca_config.masterui.serialNumber,
      maxAge: self.ca_config.masterui.maxAge,
      subjAttrs: self.ca_config.masterui.attrs,
      issuerAttrs: self.ca_config.ca_int.attrs,
      extensions: [{
        name: 'basicConstraints',
        critical: true,
        cA: false
      }, {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true
      //}, {
      //  name: 'subjectKeyIdentifier'
      }]
    },
    keys = pki.rsa.generateKeyPair(self.ca_config.masterui.keySize),
    cert = pki.createCertificate(),
    err;

  //console.log('masterui cfg:', cfg);

  cert.serialNumber = cfg.serialNumber;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + cfg.maxAge
  );

  cert.setSubject(cfg.subjAttrs);
  cert.setIssuer(cfg.issuerAttrs);
  cert.setExtensions(cfg.extensions);

  cert.publicKey = keys.publicKey;

  // Read and decrypt the Root CA Private key
  //console.log('before nfcall');
  Q.nfcall(fs.readFile, self.intPrivateKeyFile)
  .then(function (encPem) {
    //console.log('encPem:', encPem);
    var rootKey;

    try {
      rootKey = pki.decryptRsaPrivateKey(encPem, intpassphrase);
    } catch (e) {
      throw (new Error('Failed to decrypt private key'));
    }
    //console.log('rootKey:', typeof(rootKey));

    cert.sign(rootKey, forge.md.sha256.create());
    rootKey = undefined;

    var cert_pem = pki.certificateToPem(cert);

    var privkey_pkcs = pki.wrapRsaPrivateKey(
      pki.privateKeyToAsn1(
        keys.privateKey
      )
    );
    //console.log('privkey_pkcs:', privkey_pkcs);

    var keys_pem = {
      'private': pki.privateKeyInfoToPem(privkey_pkcs),
      'public': pki.publicKeyToPem(keys.publicKey),
    };

    Q.nfcall(pfs.ensurePath, path.dirname(self.masterUiCertFile))
    .then(function () {
      // create CA Root Cert Pem file
      return Q.nfcall(fs.writeFile, self.masterUiCertFile, cert_pem);
    })
    .then(function () {
      // create CA Root Private Key Pem file
      return Q.nfcall(fs.writeFile, self.masterUiPrivateKeyFile, keys_pem.private, { mode: parseInt('0600', 8) });
    })
    .then(function () {
      // create CA Root Public Key Pem file
      return Q.nfcall(fs.writeFile, self.masterUiPublicKeyFile, keys_pem.public);
    })
    .done(
      function () {
        //console.log('calling cb with cert');
        cb(undefined, cert, keys_pem);
      },
      function (err) {
        console.log('rejected err:', err);
        cb(err);
      }
    );
  })
  .fail(function (err) {
    console.log('fail err:', err);
    console.log(err.stack);
    process.nextTick(function () { cb(err); });
  });
};



Ca.prototype.checkMasterUiCert = function (cb) {
  var self = this;

  self.checkIntermediateCert(function () {
    self.checkCert(
      'Master UI',
      self.masterUiCertFile,
      self.masterUiPrivateKeyFile,
      self.masterUiPublicKeyFile,
      self.createMasterUiCert,
      { label: 'CA Intermediate' },
      false, // passphrase is not required
      cb
    );
  });

};

Ca.prototype.generateTrustedCertChain = function (cb) {
  var self = this,
    certs_p = [
      Q.nfcall(fs.readFile, self.intCertFile),
      Q.nfcall(fs.readFile, self.rootCertFile)
    ];

  Q.all(certs_p)
  .then(function (certs) {
    Q.nfcall(fs.writeFile, self.trustedCertChain, certs)
    .then(function () {
      self.copyCaCertsToAgentSslPub(function (err) {
        process.nextTick(function () { cb(err, certs); });
      });
    })
    .fail(function (err) {
      console.log(err.stack);
      process.nextTick(function () { cb(err); });
    });
  });
};

Ca.prototype.copyCaCertsToAgentSslPub = function (cb) {
  var self = this;

  Q.nfcall(pfs.ensurePath, self.PARTOUT_SSL_PUBLIC)
  .then(function () {
    return Q.nfcall(fs.readFile, self.intCertFile);
  })
  .then(function (cert) {
    return Q.nfcall(
      fs.writeFile,
      path.join(self.PARTOUT_SSL_PUBLIC, 'root_ca.crt'),
      cert
    );
  })
  .then(function () {
    return Q.nfcall(pfs.ensurePath, self.PARTOUT_AGENT_SSL_PUBLIC);
  })
  .then(function () {
    return Q.nfcall(fs.readFile, self.intCertFile);
  })
  .then(function (cert) {
    return Q.nfcall(
      fs.writeFile,
      path.join(self.PARTOUT_AGENT_SSL_PUBLIC, 'root_ca.crt'),
      cert
    );
  })

  .then(function () {
    return Q.nfcall(fs.readFile, self.rootCertFile);
  })
  .then(function (cert) {
    return Q.nfcall(
      fs.writeFile,
      path.join(self.PARTOUT_SSL_PUBLIC, 'intermediate_ca.crt'),
      cert
    );
  })
  .then(function () {
    return Q.nfcall(fs.readFile, self.rootCertFile);
  })
  .then(function (cert) {
    return Q.nfcall(
      fs.writeFile,
      path.join(self.PARTOUT_AGENT_SSL_PUBLIC, 'intermediate_ca.crt'),
      cert
    );
  })

  .then(function () {
    if (cb) {
      process.nextTick(function () { cb(); });
    }
  })
  .fail(function (err) {
    if (cb) {
      process.nextTick(function () { cb(err); });
    }
  });
};

Ca.prototype.signCsrWithAgentSigner = function (csrPem, uuid) {
  var self = this,
    csr = pki.certificationRequestFromPem(csrPem);
  var cert = pki.createCertificate();
  cert.publicKey = csr.publicKey;

  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

  csr.subject.attributes.push({
    type: '2.5.4.42',  // givenName - see http://www.alvestrand.no/objectid/2.5.4.html
    value: uuid || '',
    name: 'givenName',
    shortName: 'UUID'
  });
//  console.log('csr.subject.attributes:', csr.subject.attributes);
  cert.setSubject(csr.subject.attributes);

  //var extensions = csr.getAttribute({name: 'extensionRequest'}).extensions;
  //cert.setExtensions(extensions);

  // sign the cert with the Agent Signer
  var deferred = Q.defer();
  Q.all([
    Q.nfcall(fs.readFile, self.agentSignerPrivateKeyFile),
    Q.nfcall(fs.readFile, self.agentSignerCertFile)
  ])
  .then(function (files) {
    var agentSignerPrivateKeyPem = files[0],
      agentSignerCertPem = files[1];

//    console.log('agentSignerPrivateKeyPem:', agentSignerPrivateKeyPem);
//    console.log('agentSignerCertPem:', agentSignerCertPem);
    var agentSignerPrivateKey = pki.privateKeyFromPem(agentSignerPrivateKeyPem),
      agentSignerCert = pki.certificateFromPem(agentSignerCertPem);

    cert.setIssuer(agentSignerCert.subject.attributes);
    cert.sign(agentSignerPrivateKey, forge.md.sha256.create());

    var certPem = pki.certificateToPem(cert);
    //console.log('cert from csr:', certPem);

    deferred.resolve({certPem: certPem, cert: cert});
  }).done();

  return deferred.promise;
};


module.exports = Ca;
