/*jshint newcap: false*/
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

// Mock db controllers
var controllers = {
  agent: {
    queryOne: function (doc) {
      //console.log('agent.queryOne called with:', doc);
      return Q(doc);
    },
    update: function (doc) {
      //console.log('agent.update called with:', doc);
      return Q();
    }
  }
};

before(function () {
  appApi = express();
  appApi.use(bodyParser.json());
  appApi.use(bodyParser.urlencoded({ extended: true }));
  require('../../lib/api/routes')(routerApi, undefined, undefined, controllers);
  routerApi.mock = true;
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
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(re)
        .end(function (err, res) {
          should(err).be.null;
          should(res).not.be.undefined;
          var m = res.body;
          should(m['etc/manifest/site.p2']).not.be.undefined;
          done();
        });
      });
    });

    describe('get() file', function () {
      it('should respond with data file content', function (done) {
        var re = new RegExp('p2', 'm');
        request(appApi)
        .get('/file?file=etc/manifest/site.p2')
        .set('Accept', 'application/octet-stream')
        .expect(200)
        .expect('Content-Type', /application\/octet-stream/)
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

      it('should be able to fetch node dist testfile', function (done) {
        request(appApi)
        .get('/file?file=node/testos/testarch/testfile')
        .set('Accept', 'application/octet-stream')
        .expect(200)
        .expect('Content-Type', /application\/octet-stream/)
        .expect(/This is to test the \/nodejsManifest sync api/, done);
      });

      it('should be able to fetch agent/app.js', function (done) {
        request(appApi)
        .get('/file?file=agent/app.js')
        .set('Accept', 'application/octet-stream')
        .expect(200)
        .expect('Content-Type', /application\/octet-stream/)
        .expect(/use strict/, done);
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
          should(err).be.null;
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
          partout_agent_uuid: 'a test UUID',
          fact1: 'value of fact 1',
          fact2: 'value of fact 2',
          fact3: 'value of fact 3'
        })
        .expect(200)
        .end(function (err, res) {
          should(err).be.null;
          should(res).not.be.undefined;
          res.text.should.eql('received');
          done();
        });
      });
    });

    describe('get() nodejsManifest', function () {
      it('should respond with JSON', function (done) {
        this.timeout(10000);
        request(appApi)
        .get('/nodejsManifest?os=testos&arch=testarch')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          //console.log(res.body);
          should(err).be.null;
          should(res).not.be.undefined;
          var m = res.body;
          //console.log('m:', m);
          should(m['node/testos/testarch/testfile']).not.be.undefined;
          m['node/testos/testarch/testfile'].hash.should.eql('39a1dce124bb08bc255a01261f9e8b313c18662a78efd22246e85a7507f50eb5d064be516cc7ccd24c720f0bbe25f3ca598d4138454084ac0f64994a9f548b65');
          done();
        });
      });

      it('should respond with text file for bootstrap=1', function (done) {
        this.timeout(10000);
        request(appApi)
        .get('/nodejsManifest?os=testos&arch=testarch&bootstrap=1')
        .set('Accept', 'application/octet-stream')
        .expect(200)
        .expect('Content-Type', /application\/octet-stream/)
        .expect(/node\/testos\/testarch\/testfile/, done);
      });
    });

    describe('get() agentManifest', function () {
      it('should respond with JSON', function (done) {
        this.timeout(30000);
        request(appApi)
        .get('/agentManifest?test=1')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          //console.log(res.body);
          should(err).be.null;
          should(res).not.be.undefined;
          var m = res.body;
          //console.log('m:', m);
          should(m['agent/app.js']).not.be.undefined;
          done();
        });
      });

      it('should respond with text file for bootstrap=1', function (done) {
        this.timeout(10000);
        request(appApi)
        .get('/agentManifest?test=1&bootstrap=1')
        .set('Accept', 'application/octet-stream')
        .expect(200)
        .expect('Content-Type', /application\/octet-stream/)
        .expect(/agent\/app.js/, done);
      });
    });

    describe('get() fileAttrs', function () {
      it('should respond with file\'s attributes', function (done) {
        request(appApi)
        .get('/fileAttrs?file=node/linux/x64/bin/node')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /application\/json/)
        //.expect(re, done);
        .end(function (err, res) {
          should(err).be.null;
          should(res).not.be.undefined;
          var attrs = res.body;
          should(attrs).not.be.undefined;
          //console.log('attrs:', attrs);
          attrs.mode.should.eql(parseInt('0100755', 8));
          done();
        });
      });

      it('should respond with just text mode for bootstrap=1', function (done) {
        request(appApi)
        .get('/fileAttrs?file=node/linux/x64/bin/node&bootstrap=1')
        .set('Accept', 'application/octet-stream')
        .expect(200)
        .expect('Content-Type', /application\/octet-stream/)
        .expect(/0100755/, done);
      });
    });

  }); // REST APIs

});
