/*jshint newcap: false, proto: true*/
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
    origreq = require('express').request,
    routerApi = express.Router(),
    bodyParser = require('body-parser'),
    Q = require('q'),
    fs = require('fs'),
    u = require('util');
  //utils = new (require('../agent/lib/utils'))();

global.should = require('should');
should.extend();

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

var appApi;

// Mock db controllers
var controllers = {
  agent: {
    queryOne: function (doc) {
      //console.log('agent.queryOne called with:', doc);
      doc.env = 'default';
      return Q(doc);
    },
    update: function (doc) {
      //console.log('agent.update called with:', doc);
      return Q();
    }
  }
};

/**
 * Create new mocked Request object
 * @param   {object} app    Express router
 * @param   {string} method GET, POST, etc
 * @param   {string} url    URL for api call, e.g. '/manifest'
 *                          @param   {string} env    Environment
 * @returns {object} req
 */
function newReq (app, method, url, env) {
  return {
    __proto__: origreq,
    app: app,
    url: url,
    method: method.toUpperCase(),
    headers: {
      'transfer-encoding': 'chunked'
    },
    client: {
      authorized: true
    },
    connection: {
      getPeerCertificate: function () {
        // TODO: Mock client cert with GN as UUID
        return {
          subject: {
            GN: 'XXXX-XXXXX'
          }
        };
      },
      remoteAddress: '127.0.0.1'
    },
    agent: {
      _key: 'XXXX-XXXXX',
      env: env
    },
  };
}

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
        var re = new RegExp('etc/manifest/default/site_example\.p2', 'gm');

        // Mock up Request and Response objects
        var req = newReq(appApi, 'GET', '/manifest', 'default');
        //console.log('req', req);

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(200);
            return this;
          },
          send: function (o) {
            should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            done();
            return this;
          },
          json: function (o) {
            var env = o.environment,
                m = o.manifest;
            should(env).not.be.undefined();
            env.should.equal('default');

            //console.log('res json:', m);
            should(m['etc/manifest/default/site_example.p2']).not.be.undefined();
            done();
          }
        };

        appApi(req, res, function (err) {} );

      });
    });

    describe('get() file', function () {
      it('should respond with data file content', function (done) {
        var re = new RegExp('p2', 'm');

        // Mock up Request and Response objects
        var req = newReq(appApi, 'GET', '/file?file=etc/manifest/default/site_example.p2', 'default');

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(200);
            status = code;
            return this;
          },
          write: function (d) {
            if (status !== 200) {
              should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            } else {
              should(d).not.be.undefined();
              d.should.be.a.String();
              d.length.should.be.above(0);
            }
            return this;
          },
          end: function () {
            done();
          }
        };

        appApi(req, res, function (err) {} );

      });

      it('should catch attempts to use absolute paths (expect SECURITY VIOLATION msg above)', function (done) {

        // Mock up Request and Response objects
        var req = newReq(appApi, 'GET', '/file?file=/badstuff', 'default');

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(403);
            status = code;
            return this;
          },
          write: function (d) {
            if (status !== 403) {
              should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            }
//            done();
            return this;
          },
          end: function () {
            done();
          }
        };

        appApi(req, res, function (err) {} );
      });

      it('should catch attempts to use ../ (expect SECURITY VIOLATION msg above)', function (done) {

        // Mock up Request and Response objects
        var req = newReq(appApi, 'GET', '/file?file=etc/manifest/../../../../badstuff', 'default');

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(403);
            status = code;
            return this;
          },
          write: function (d) {
            if (status !== 403) {
              should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            }
//            done();
            return this;
          },
          end: function () {
            done();
          }
        };

        appApi(req, res, function (err) {} );
      });

      it('should be able to fetch node dist testfile', function (done) {

        // Mock up Request and Response objects
        var req = newReq(appApi, 'GET', '/file?file=node/testos/testarch/testfile', 'default');

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(200);
            status = code;
            return this;
          },
          write: function (d) {
            if (status !== 200) {
              should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            } else {
              should(d).not.be.undefined();
              d.should.be.a.String();
              d.length.should.be.above(0);
            }
//            done();
            return this;
          },
          end: function () {
            done();
          }
        };

        appApi(req, res, function (err) {} );
      });

      it('should be able to fetch agent/app.js', function (done) {

        // Mock up Request and Response objects
        var req = newReq(appApi, 'GET', '/file?file=agent/app.js', 'default');

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(200);
            status = code;
            return this;
          },
          write: function (d) {
            if (status !== 200) {
              should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            } else {
              should(d).not.be.undefined();
              d.should.be.a.String();
              d.length.should.be.above(0);
            }
//            done();
            return this;
          },
          end: function () {
            done();
          }
        };

        appApi(req, res, function (err) {} );
      });
    });

    describe('post() event', function () {
      it('should allow to post an event msg', function (done) {

        // Mock up Request and Response objects
        var req = newReq(appApi, 'POST', '/event', 'default');
        req.body = {
          module: 'testmodule',
          msg: 'my test event message',
          object: 'myObject'
        };

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(200);
            status = code;
            return this;
          },
          send: function (d) {
            if (status !== 200) {
              should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            } else {
              should(d).not.be.undefined();
              d.should.be.a.String();
              d.should.equal('received');
            }
            done();
            return this;
          },
        };

        appApi(req, res, function (err) {} );
      });
    });

    describe('post() facts', function () {
      it('should allow to post facts to master', function (done) {

        // Mock up Request and Response objects
        var req = newReq(appApi, 'POST', '/facts', 'default');
        req.body = {
          partout_agent_uuid: 'a test UUID',
          fact1: 'value of fact 1',
          fact2: 'value of fact 2',
          fact3: 'value of fact 3'
        };

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(200);
            status = code;
            return this;
          },
          send: function (d) {
            if (status !== 200) {
              should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            } else {
              should(d).not.be.undefined();
              d.should.be.a.String();
              d.should.equal('received');
            }
            done();
            return this;
          },
        };

        appApi(req, res, function (err) {} );
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

        // Mock up Request and Response objects
        var req = newReq(appApi, 'GET', '/fileAttrs?file=node/linux/x64/bin/node', 'default');

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(200);
            status = code;
            return this;
          },
          send: function (d) {
            should.fail('REACHED', 'NOTREACHED', 'send method called - failed test', 'send()');
            done();
            return this;
          },
          json: function (attrs) {
            if (status !== 200) {
              should.fail('REACHED', 'NOTREACHED', 'json method called, bad status - failed test', 'json()');
            } else {
              should(attrs).not.be.undefined();
              attrs.should.be.an.Object();
              should(attrs.mode).not.be.undefined();
              attrs.mode.should.eql(parseInt('0100755', 8));
            }
            done();
            return this;
          }
        };

        appApi(req, res, function (err) {} );

      });

      it('should respond with just text mode for bootstrap=1', function (done) {

//        request(appApi)
//        .get('/fileAttrs?file=node/linux/x64/bin/node&bootstrap=1')
//        .set('Accept', 'application/octet-stream')
//        .expect(200)
//        .expect('Content-Type', /application\/octet-stream/)
//        .expect(/0100755/, done);

        // Mock up Request and Response objects
        var req = newReq(appApi, 'GET', '/fileAttrs?file=node/linux/x64/bin/node&bootstrap=1', 'default');

        var status;

        var res = {
          setHeader: function () {},
          status: function (code) {
            code.should.equal(200);
            status = code;
            return this;
          },
          send: function (attrs) {
            if (status !== 200) {
              should.fail('REACHED', 'NOTREACHED', 'send method called, bad status - failed test', 'send()');
            } else {
              should(attrs).not.be.undefined();
              attrs.trim().should.equal('0100755');
            }
            done();
            return this;
          }
        };

        appApi(req, res, function (err) {} );
      });
    });

  }); // REST APIs

});
