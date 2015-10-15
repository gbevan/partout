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

});
