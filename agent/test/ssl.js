/*jslint node: true */
'use strict';

/*jshint -W030 */

/*global describe, before, it, should*/
var assert = require('assert'),
    expect = require('expect'),
    rmdir = require('rmdir'),
    cfg = new (require('../etc/partout_agent.conf.js'))(),
    Ssl = require('../lib/ssl'),
    Q = require('q'),
    pfs = require('../lib/pfs'),
    path = require('path');

var should = require('should');

describe('Ssl', function () {
  //console.log('in Ssl');

  var ssl,
      pemCA,
      pemIntCA,
      pemServer,
      sslTestDir = path.join(cfg.PARTOUT_VARDIR, 'ssl-test');

  before(function () {
    ssl = new Ssl(cfg);
  });

  it('should have method setSslDir()', function () {
    should(ssl.setSslDir).be.a.Function;
  });
  it('should have method getSslDir()', function () {
    should(ssl.getSslDir).be.a.Function;
  });
  describe('set/getSslDir', function () {
    it ('should set and return the test SSL Dir', function (done) {
      ssl.setSslDir(sslTestDir);
      ssl.getSslDir().should.eql(sslTestDir);
      console.log('ssl dir:', ssl.getSslDir());

      // remove ssl-test folder and contents before rest of tests
      rmdir(sslTestDir, function (err, dirs, files) {
        //console.log( dirs );
        //console.log( files );
        //console.log( 'all files are removed' );
        done();
      });
    });
  });

  it('should have method setSslAgentPrefix()', function () {
    should(ssl.setSslAgentPrefix).be.a.Function;
  });
  it('should have method getSslAgentPrefix()', function () {
    should(ssl.getSslAgentPrefix).be.a.Function;
  });
  describe('set/getSslAgentPrefix', function () {
    it ('should set and return the test SSL Agent Prefix', function () {
      ssl.setSslAgentPrefix('TEST.agent');
      ssl.getSslAgentPrefix().should.eql('TEST.agent');
    });
  });


  it('should have method genCsr()', function () {
    should(ssl.genCsr).not.be.undefined;
    ssl.genCsr.should.be.a.Function();
  });

  describe('genCsr()', function () {
    it('should create a certificate signing request (csr)', function (done) {
      this.timeout(20000);

      pfs.pExists(sslTestDir)

      .then(function (sslDirExists) {
        if (sslDirExists) {
          return Q.defer().resolve();
        } else {
          return Q.defer().reject();
        }
      })

      .then(function() {

        var attrs = [{
          name: 'commonName',
          value: 'TEST.host.name'
        }, {
          shortName: 'OU',
          value: 'Partout'
        }];

        ssl.genCsr({
          //serialNumber: '01',
          //maxAge: 50,
          subjAttrs: attrs,
          /*
          extensions: [{
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
          }],
          */
          keySize: 512
        }, function (err, csr) {

          should(csr).not.be.null;
          //console.log('csr:', csr);
          //console.log('csr.subject.getField(CN):', csr.subject.getField('CN'));
          //console.log('csr.subject.getField(CN).value:', csr.subject.getField('CN').value);

          csr.subject.getField('CN').should.have.property('value');
          csr.subject.getField('CN').value.should.equal('TEST.host.name');

          //should(csr.version).not.be.null;
          //should(csr.serialNumber).not.be.null;

          // test files created
          //console.log('ssl.agentCsrFile:', ssl.agentCsrFile);
          pfs.pExists(ssl.agentCsrFile)
          .then(function (exists) {
            exists.should.be.true;

            return pfs.pExists(ssl.agentPrivateKeyFile);
          })
          .then(function (exists) {
            exists.should.be.true;

            return pfs.pExists(ssl.agentPublicKeyFile);
          })
          .done(function (exists) {
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

  }); // createMasterCsr

});
