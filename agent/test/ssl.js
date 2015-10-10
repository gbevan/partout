/*jslint node: true */
'use strict';

/*jshint -W030 */

/*global describe, before, it, should*/
var assert = require('assert'),
  expect = require('expect'),
  Ssl = require('../lib/ssl');

GLOBAL.should = require('should');
should.extend();

describe('Ssl', function () {
  console.log('in Ssl');

  var ssl,
    pemCA,
    pemIntCA,
    pemServer;

  before(function () {
    ssl = new Ssl();
  });

  it('should have method gencert()', function () {
    should(ssl.gencert).not.be.undefined;
    should(ssl.gencert).be.function;
  });

  it('should have method createCA()', function () {
    should(ssl.createCA).not.be.undefined;
    should(ssl.createCA).be.function;
  });

  it('should have method createIntermediateCA()', function () {
    should(ssl.createIntermediateCA).not.be.undefined;
    should(ssl.createIntermediateCA).be.function;
  });

  describe('Ssl method gencert()', function () {
    it('should return a certificate', function () {
      var attrs = [{
        name: 'commonName',
        value: 'hostName'
      }, {
        shortName: 'OU',
        value: 'Partout'
      }],
      cert = ssl.gencert({
        serialNumber: '01',
        maxAge: 50,
        subjAttrs: attrs,
        issuerAttrs: attrs,
        extensions: [{
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
        }]
      });

      should(cert).not.be.null;
      //console.log('cert:', cert);
      should(cert.version).not.be.null;
      should(cert.serialNumber).not.be.null;
      // should not yet be signed
      should(cert.signature).be.null;
    });

  }); // gencert

  /*
  describe('Ssl method createCA()', function () {
    it('should return a CA root pem object containing public/private/certificate/certObj', function () {
      var CAattrs = [{
        name: 'commonName',
        value: 'CA TEST Root'
      }, {
        shortName: 'OU',
        value: 'Partout'
      }];

      this.timeout(60000);

      pemCA = ssl.createCA({
        serialNumber: '01',
        maxAge: 50,
        subjAttrs: CAattrs,
        issuerAttrs: CAattrs
      }, 512);  // small key to speed up test, defaults to 4096

      should(pemCA).not.be.undefined;
      pemCA.should.have.property('private');
      pemCA.should.have.property('public');
      pemCA.should.have.property('cert');
      pemCA.should.have.property('certObj');

      console.log('certObj:', pemCA.certObj);
      should(pemCA.certObj).not.be.null;
      pemCA.certObj.should.be.a.string;
      //console.log('issuer:', pem.certObj.issuer.getField('CN'));
      pemCA.certObj.issuer.getField('CN').should.have.property('value');
      pemCA.certObj.issuer.getField('CN').value.should.equal('CA TEST Root');

      //console.log('subject:', pem.certObj.subject);
      pemCA.certObj.subject.getField('CN').should.have.property('value');
      pemCA.certObj.subject.getField('CN').value.should.equal('CA TEST Root');

      // test extensions
      should(pemCA.certObj.extensions).not.be.undefined;
      //console.log('extensions:', pemCA.certObj.extensions);
    });
  });

  describe('Ssl method createIntermediateCA()', function () {
    it('should return an Intermediate CA pem object containing public/private/certificate/certObj', function () {
      var CAattrs = [{
        name: 'commonName',
        value: 'CA TEST Intermediate'
      }, {
        shortName: 'OU',
        value: 'Partout'
      }];

      var IntCAattrs = [{
        name: 'commonName',
        value: 'CA TEST Intermediate'
      }, {
        shortName: 'OU',
        value: 'Partout'
      }];

      this.timeout(60000);
      console.log('pemCA:', pemCA);
      pemIntCA = ssl.createIntermediateCA(IntCAattrs, {
        serialNumber: '01',
        maxAge: 50,
        subjAttrs: IntCAattrs,
        issuerAttrs: CAattrs
      }, 512, pemCA);  // small key to speed up test, defaults to 4096
      console.log('pemIntCA:', pemIntCA);
      console.log('pemIntCA.subject:', pemIntCA.certObj.subject.attributes);
      console.log('pemIntCA.issuer:', pemIntCA.certObj.issuer.attributes);

      should(pemIntCA).not.be.undefined;
      pemIntCA.should.have.property('private');
      pemIntCA.should.have.property('public');
      pemIntCA.should.have.property('cert');
      pemIntCA.should.have.property('certObj');

      //console.log('certObj:', pemIntCA.certObj);
      should(pemIntCA.certObj).not.be.null;
      pemIntCA.certObj.should.be.a.string;

      //console.log('subject:', pem.certObj.subject);
      pemIntCA.certObj.subject.getField('CN').should.have.property('value');
      pemIntCA.certObj.subject.getField('CN').value.should.equal('CA TEST Intermediate');

      //console.log('issuer:', pem.certObj.issuer.getField('CN'));
      pemIntCA.certObj.issuer.getField('CN').should.have.property('value');
      pemIntCA.certObj.issuer.getField('CN').value.should.equal('CA TEST Root');

      // test extensions
      should(pemIntCA.certObj.extensions).not.be.undefined;
    });
  });
  */

  describe('Ssl method createMasterCert()', function () {
    it('should have method createMasterCert()', function () {
      should(ssl.createMasterCert).not.be.undefined;
      ssl.createMasterCert.should.be.a.function;
    });

    it('should return a server certificate pem object containing public/private/certificate/certObj', function () {
      var IntCAattrs = [{
        name: 'commonName',
        value: 'CA TEST Intermediate'
      }, {
        shortName: 'OU',
        value: 'Partout'
      }];

      var Serverattrs = [{
        name: 'commonName',
        value: 'Partout Master Server Cert'
      }, {
        shortName: 'OU',
        value: 'Partout'
      }];

      this.timeout(60000);
      console.log('pemIntCA:', pemIntCA);
      pemServer = ssl.createMasterCert(
        Serverattrs, {
          serialNumber: '01',
          maxAge: 50,
          subjAttrs: Serverattrs,
          issuerAttrs: IntCAattrs
        },
        512, // small key to speed up test, defaults to 2048
        pemIntCA
      );
      console.log('pemServer:', pemServer);
      console.log('pemServer.subject:', pemServer.certObj.subject.attributes);
      console.log('pemServer.issuer:', pemServer.certObj.issuer.attributes);

      should(pemServer).not.be.undefined;
      pemServer.should.have.property('private');
      pemServer.should.have.property('public');
      pemServer.should.have.property('cert');
      pemServer.should.have.property('certObj');

      //console.log('certObj:', pemIntCA.certObj);
      should(pemServer.certObj).not.be.null;
      pemServer.certObj.should.be.a.string;

      //console.log('subject:', pem.certObj.subject);
      pemServer.certObj.subject.getField('CN').should.have.property('value');
      pemServer.certObj.subject.getField('CN').value.should.equal('Partout Master Server Cert');

      //console.log('issuer:', pem.certObj.issuer.getField('CN'));
      pemServer.certObj.issuer.getField('CN').should.have.property('value');
      pemServer.certObj.issuer.getField('CN').value.should.equal('CA TEST Intermediate');

      // test extensions
      should(pemServer.certObj.extensions).not.be.undefined;
    });

  });

});
