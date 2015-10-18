/*jslint node: true */
'use strict';

/*jshint -W030 */

/*global describe, before, it, should*/
var assert = require('assert'),
  expect = require('expect'),
  request = require('supertest'),
  express = require('express'),
  routerApi = express.Router(),
  bodyParser = require('body-parser'),
  Q = require('q'),
  fs = require('fs');
  //utils = new (require('../agent/lib/utils'))();

GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;

var appApi;

before(function () {
  appApi = express();
  appApi.use(bodyParser.json());
  appApi.use(bodyParser.urlencoded({ extended: true }));
  require('../../lib/api/routes')(routerApi);
  appApi.use('/', routerApi);
});

describe('appApi', function () {
  it('should load the appApi', function () {
    should(appApi).not.be.undefined;
  });
});

describe('api/routes', function () {

  /*********************
   * REST API tests
   */

  describe('REST APIs', function () {

    describe('get() manifest', function () {
      it('should respond with JSON', function (done) {
        var re = new RegExp('etc/manifest/site\.p2', 'gm');
        request(appApi)
        .get('/manifest')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(re)
        .end(function (err, res) {
          should(err).be_undefined;
          should(res).not.be.undefined;
          var m = res.body;
          should(m['etc/manifest/site.p2']).not.be.undefined;
          done();
        });
      });
    });

    describe('get() file', function () {
      it('should respond with data file', function (done) {
        var re = new RegExp('p2', 'm');
        request(appApi)
        .get('/file?file=etc/manifest/site.p2')
        .set('Accept', 'application/octet-stream')
        .expect('Content-Type', /application\/octet-stream/)
        .expect(200)
        .expect(re, done);
      });

      it('should catch attempts to use absolute paths (expect SECURITY VIOLATION msg above)', function (done) {
        request(appApi)
        .get('/file?file=/badstuff')
        .expect(403, done);
      });

      it('should catch attempts to use ../ (expect SECURITY VIOLATION msg above)', function (done) {
        request(appApi)
        .get('/file?file=etc/manifest/../../../../badstuff')
        .expect(403, done);
      });
    });

    describe('post() event', function () {
      it('should allow to post an event msg', function (done) {
        request(appApi)
        .post('/event')
        .send({
          module: 'testmodule',
          msg: 'my test event message',
          object: 'myObject'
        })
        .expect(200)
        .end(function (err, res) {
          should(err).be_undefined;
          should(res).not.be.undefined;
          res.text.should.eql('received');
          done();
        });
      });
    });

    describe('post() facts', function () {
      it('should allow to post facts to master', function (done) {
        request(appApi)
        .post('/facts')
        .send({
          fact1: 'value of fact 1',
          fact2: 'value of fact 2',
          fact3: 'value of fact 3'
        })
        .expect(200)
        .end(function (err, res) {
          should(err).be_undefined;
          should(res).not.be.undefined;
          res.text.should.eql('received');
          done();
        });
      });
    });

  }); // REST APIs

});
