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

  it('should nolonger have method gencert()', function () {
    should(ssl.gencert).be.undefined;
  });

  it('should have method genCsr()', function () {
    should(ssl.genCsr).not.be.undefined;
    should(ssl.genCsr).be.function;
  });

  describe('Ssl method genCsr()', function () {
    it('should return a certificate signing request (csr)', function () {
      var attrs = [{
        name: 'commonName',
        value: 'hostName'
      }, {
        shortName: 'OU',
        value: 'Partout'
      }],
      csr = ssl.genCsr({
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
      });

      should(csr).not.be.null;
      //console.log('cert:', cert);
      //should(csr.version).not.be.null;
      //should(csr.serialNumber).not.be.null;
    });

  }); // createMasterCsr

});
