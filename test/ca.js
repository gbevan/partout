/*jslint node: true */
'use strict';

/*jshint -W030 */

/*global describe, before, it, should*/
var assert = require('assert'),
  expect = require('expect'),
  Ca = require('../lib/ca'),
  rmdir = require('rmdir'),
  Q = require('q'),
  fs = require('fs'),
  utils = new (require('../agent/lib/utils'))(),
  path = require('path'),
  os = require('os');

GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;

describe('Ca', function () {

  var ca;

  before(function () {
    ca = new Ca();

    // reduce key sizes for test speed
    var keySize = 512;
    ca.ca_config.ca_root.keySize = keySize;
    ca.ca_config.ca_int.keySize = keySize;
    ca.ca_config.agentsigner.keySize = keySize;
    ca.ca_config.masterapi.keySize = keySize;
    ca.ca_config.masterui.keySize = keySize;

    ca.PARTOUT_SSL_PUBLIC = './etc/ssl-test';
    ca.PARTOUT_AGENT_SSL_PUBLIC = './agent/etc/ssl-test';
  });


  it('should have method setSslDir()', function () {
    should(ca.setSslDir).be.a.Function;
  });
  it('should have method getSslDir()', function () {
    should(ca.getSslDir).be.a.Function;
  });
  describe('set/getSslDir', function () {
    it ('should set and return the test SSL Dir', function (done) {
      ca.setSslDir('./etc/ssl-test');
      ca.getSslDir().should.eql('./etc/ssl-test');

      // remove ssl-test folder and contents before rest of tests
      rmdir('./etc/ssl-test', function (err, dirs, files) {
        //console.log( dirs );
        //console.log( files );
        //console.log( 'all files are removed' );
        done();
      });
    });
  });


  it('should have method setSslCaPrefix()', function () {
    should(ca.setSslCaPrefix).be.a.Function;
  });
  it('should have method getSslCaPrefix()', function () {
    should(ca.getSslCaPrefix).be.a.Function;
  });
  describe('set/getSslCaPrefix', function () {
    it ('should set and return the test SSL CA Prefix', function () {
      ca.setSslCaPrefix('TEST.root_ca.');
      ca.getSslCaPrefix().should.eql('TEST.root_ca.');
    });
  });


  it('should have method setSslIntCaPrefix()', function () {
    should(ca.setSslIntCaPrefix).be.a.Function;
  });
  it('should have method getSslIntCaPrefix()', function () {
    should(ca.getSslIntCaPrefix).be.a.Function;
  });
  describe('set/getSslIntCaPrefix', function () {
    it ('should set and return the test SSL Interim CA Prefix', function () {
      ca.setSslIntCaPrefix('TEST.intermediate_ca.');
      ca.getSslIntCaPrefix().should.eql('TEST.intermediate_ca.');
    });
  });

  it('should have method setSslAgentSignerPrefix()', function () {
    should(ca.setSslAgentSignerPrefix).be.a.Function;
  });
  it('should have method getSslAgentSignerPrefix()', function () {
    should(ca.getSslAgentSignerPrefix).be.a.Function;
  });
  describe('set/getSslAgentSignerPrefix', function () {
    it ('should set and return the test SSL Agent Signer Prefix', function () {
      ca.setSslAgentSignerPrefix('TEST.agentsigner.');
      ca.getSslAgentSignerPrefix().should.eql('TEST.agentsigner.');
    });
  });

  it('should have method setSslMasterApiPrefix()', function () {
    should(ca.setSslMasterApiPrefix).be.a.Function;
  });
  it('should have method getSslMasterApiPrefix()', function () {
    should(ca.getSslMasterApiPrefix).be.a.Function;
  });
  describe('set/getSslMasterApiPrefix', function () {
    it ('should set and return the test SSL Master API Prefix', function () {
      ca.setSslMasterApiPrefix('TEST.masterapi.');
      ca.getSslMasterApiPrefix().should.eql('TEST.masterapi.');
    });
  });

  it('should have method setSslMasterUiPrefix()', function () {
    should(ca.setSslMasterUiPrefix).be.a.Function;
  });
  it('should have method getSslMasterUiPrefix()', function () {
    should(ca.getSslMasterUiPrefix).be.a.Function;
  });
  describe('set/getSslMasterUiPrefix', function () {
    it ('should set and return the test SSL Master UI Prefix', function () {
      ca.setSslMasterUiPrefix('TEST.masterui.');
      ca.getSslMasterUiPrefix().should.eql('TEST.masterui.');
    });
  });


  /*********************************
   * Root Cert Tests
   */
  it('should have method checkRootCert()', function () {
    should(ca.checkRootCert).be.a.Function;
  });

  it('should have method createRootCert()', function () {
    should(ca.createRootCert).be.a.Function;
  });

  describe('createRootCert', function () {
    it('should create a Root CA certificate', function (done) {

      utils.pExists('./etc/ssl-test')

      .then(function () {
        ca.createRootCert('my root pass phrase', function (err, certObj, pemCA) {
          should(err).be.undefined;
          should(certObj).not.be.undefined;
          should(pemCA).not.be.undefined;

          pemCA.should.have.property('private');
          pemCA.should.have.property('public');

          certObj.issuer.getField('CN').should.have.property('value');
          certObj.issuer.getField('CN').value.should.equal('Partout CA Root');

          certObj.subject.getField('CN').should.have.property('value');
          certObj.subject.getField('CN').value.should.equal('Partout CA Root');

          // test extensions
          should(certObj.extensions).not.be.undefined;

          // test files created
          utils.pExists(ca.rootCertFile)
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.rootPrivateKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.rootPublicKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            done();
          });
        });
      })

      .fail(function (err) {
        console.log('*** failed');
        console.log('err:', err);
        console.log(err.stack);
      });
    });
  });

  /*********************************
   * Intermediate Cert Tests
   */
  it('should have method checkIntermediateCert()', function () {
    should(ca.checkIntermediateCert).be.a.Function;
  });

  it('should have method createIntermediateCert()', function () {
    should(ca.createIntermediateCert).be.a.Function;
  });

  describe('createIntermediateCert', function () {
    it('should create an Intermediate CA certificate', function (done) {

      utils.pExists('./etc/ssl-test')

      .then(function (sslDirExists) {
        if (sslDirExists) {
          return Q.defer().resolve();
        } else {
          return Q.defer().reject();
        }
      })

      .then(function () {
        ca.createIntermediateCert('my root pass phrase', 'my int pass phrase', function (err, certObj, pemCA) {
          should(err).be.undefined;
          should(certObj).not.be.undefined;
          should(pemCA).not.be.undefined;

          pemCA.should.have.property('private');
          pemCA.should.have.property('public');

          certObj.issuer.getField('CN').should.have.property('value');
          certObj.issuer.getField('CN').value.should.equal('Partout CA Root');

          certObj.subject.getField('CN').should.have.property('value');
          certObj.subject.getField('CN').value.should.equal('Partout CA Intermediate');

          // test extensions
          should(certObj.extensions).not.be.undefined;

          // test files created
          utils.pExists(ca.intCertFile)
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.intPrivateKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.intPublicKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            done();
          });
        });
      })

      .fail(function (err) {
        console.log('*** failed');
        console.log('err:', err);
        console.log(err.stack);
        should(err).be.undefined;
      });
    });
  });


  /*********************************
   * Agent Signer Cert Tests
   */
  it('should have method checkAgentSignerCert()', function () {
    should(ca.checkAgentSignerCert).be.a.Function;
  });

  it('should have method createAgentSignerCert()', function () {
    should(ca.createAgentSignerCert).be.a.Function;
  });

  describe('createAgentSignerCert', function () {
    it('should create an Agent Signer certificate', function (done) {

      utils.pExists('./etc/ssl-test')

      .then(function (sslDirExists) {
        if (sslDirExists) {
          return Q.defer().resolve();
        } else {
          return Q.defer().reject();
        }
      })

      .then(function () {
        ca.createAgentSignerCert('my int pass phrase', function (err, certObj, pem) {
          should(err).be.undefined;
          should(certObj).not.be.undefined;
          should(pem).not.be.undefined;

          pem.should.have.property('private');
          pem.should.have.property('public');

          certObj.issuer.getField('CN').should.have.property('value');
          certObj.issuer.getField('CN').value.should.equal('Partout CA Intermediate');

          certObj.subject.getField('CN').should.have.property('value');
          certObj.subject.getField('CN').value.should.equal('Partout Agent Signer');

          // test extensions
          should(certObj.extensions).not.be.undefined;

          // test files created
          utils.pExists(ca.agentSignerCertFile)
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.agentSignerPrivateKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.agentSignerPublicKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            done();
          });
        });
      })

      .fail(function (err) {
        console.log('*** failed');
        console.log('err:', err);
        console.log(err.stack);
        should(err).be.undefined;
      });
    });
  });

  /*********************************
   * Master API Server Cert Tests
   */
  it('should have method checkMasterApiCert()', function () {
    should(ca.checkMasterApiCert).be.a.Function;
  });

  it('should have method createMasterApiCert()', function () {
    should(ca.createMasterApiCert).be.a.Function;
  });

  describe('createMasterApiCert', function () {
    it('should create an Master API certificate', function (done) {

      utils.pExists('./etc/ssl-test')

      .then(function (sslDirExists) {
        if (sslDirExists) {
          return Q.defer().resolve();
        } else {
          return Q.defer().reject();
        }
      })

      .then(function () {
        ca.createMasterApiCert('my int pass phrase', function (err, certObj, pem) {
          should(err).be.undefined;
          should(certObj).not.be.undefined;
          should(pem).not.be.undefined;

          pem.should.have.property('private');
          pem.should.have.property('public');

          certObj.issuer.getField('CN').should.have.property('value');
          certObj.issuer.getField('CN').value.should.equal('Partout CA Intermediate');

          certObj.subject.getField('CN').should.have.property('value');
          //certObj.subject.getField('CN').value.should.equal(os.hostname());

          // test extensions
          should(certObj.extensions).not.be.undefined;

          // test files created
          utils.pExists(ca.masterApiCertFile)
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.masterApiPrivateKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.masterApiPublicKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            done();
          });
        });
      })

      .fail(function (err) {
        console.log('*** failed');
        console.log('err:', err);
        console.log(err.stack);
        should(err).be.undefined;
      });
    });
  });


  /*********************************
   * Master UI Server Cert Tests
   */
  it('should have method checkMasterUiCert()', function () {
    should(ca.checkMasterUiCert).be.a.Function;
  });

  it('should have method createMasterUiCert()', function () {
    should(ca.createMasterUiCert).be.a.Function;
  });

  describe('createMasterUiCert', function () {
    it('should create an Master UI certificate', function (done) {

      utils.pExists('./etc/ssl-test')

      .then(function (sslDirExists) {
        if (sslDirExists) {
          return Q.defer().resolve();
        } else {
          return Q.defer().reject();
        }
      })

      .then(function () {
        ca.createMasterUiCert('my int pass phrase', function (err, certObj, pem) {
          should(err).be.undefined;
          should(certObj).not.be.undefined;
          should(pem).not.be.undefined;

          pem.should.have.property('private');
          pem.should.have.property('public');

          certObj.issuer.getField('CN').should.have.property('value');
          certObj.issuer.getField('CN').value.should.equal('Partout CA Intermediate');

          certObj.subject.getField('CN').should.have.property('value');
          //certObj.subject.getField('CN').value.should.equal(os.hostname());

          // test extensions
          should(certObj.extensions).not.be.undefined;

          // test files created
          utils.pExists(ca.masterUiCertFile)
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.masterUiPrivateKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            return utils.pExists(ca.masterUiPublicKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            done();
          });
        });
      })

      .fail(function (err) {
        console.log('*** failed');
        console.log('err:', err);
        console.log(err.stack);
        should(err).be.undefined;
      });
    });
  });

  /*********************************
   * Trusted Key Chain
   */
  it('should have method generateTrustedCertChain()', function () {
    should(ca.generateTrustedCertChain).be.a.Function;
  });

  describe('generateTrustedCertChain', function () {
    it('should return and create the trusted certificate chain', function (done) {
      ca.generateTrustedCertChain(function (err, certChain) {
        should(err).be.undefined;
        should(certChain).not.be.undefined;
        utils.pExists(ca.trustedCertChain)
        .done(function (exists) {
          exists.should.be.true;
          done();
        });
      });
    });
  });

  it('should have method copyCaCertsToAgentSslPub()', function () {
    should(ca.copyCaCertsToAgentSslPub).be.a.Function;
  });

  describe('copyCaCertsToAgentSslPub', function () {
    it('should create copies of the ca certs in ssl_public without error', function (done) {
      ca.copyCaCertsToAgentSslPub(function (err) {
        should(err).be.undefined;

        utils.pExists(path.join(ca.PARTOUT_SSL_PUBLIC, 'root_ca.crt'))
        .then(function (exists) {
          exists.should.be.true;

          utils.pExists(path.join(ca.PARTOUT_SSL_PUBLIC, 'intermediate_ca.crt'))
          .then(function (exists) {
            exists.should.be.true;

            utils.pExists(path.join(ca.PARTOUT_AGENT_SSL_PUBLIC, 'root_ca.crt'))
            .then(function (exists) {
              exists.should.be.true;

              utils.pExists(path.join(ca.PARTOUT_AGENT_SSL_PUBLIC, 'intermediate_ca.crt'))
              .then(function (exists) {
                exists.should.be.true;
                done();
              });
            });
          });
        })

        .fail(function (err) {
          should(err).be.undefined;
        });

      });
    });
  });

  /************************************************
   * verify certificates against trusted key chain
   *
   * using openssl:
   *  openssl x509 -noout -text -in root_ca.cert.pem
   *  openssl verify -CAfile ca_cert.pem cert.pem
   *  curl -v --cacert trusted_cert_chain.crt  https://officepc:11443
   */




});
