/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*global describe, before, it, should, context*/
var assert = require('assert'),
  expect = require('expect'),
  Ca = require('../lib/ca'),
  rmdir = require('rmdir'),
  Q = require('q'),
  fs = require('fs'),
  pfs = new (require('../agent/lib/pfs'))(),
  path = require('path'),
  os = require('os');

GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;

describe('Db', function () {
  var cfg = new (require('../etc/partout.conf.js'))(),
      Db = require('../lib/db'),
      db = new Db(cfg);

  it ('class should exist', function () {
    should(Db).exist;
  });

  it ('instance should exist', function () {
    should(db).exist;
  });

  describe('method getDbName()', function () {
    it ('should exist', function () {
      should(db.getDbName).not.be.undefined;
    });
    it ('should be a function', function () {
      db.getDbName.should.be.a.function;
    });

    it ('should return a dbname from cfg', function () {
      db.getDbName().should.exist;
      db.getDbName().should.equal(cfg.database_name);
    });

    it ('should return the partout-test name', function () {
      db.getDbName().should.equal('partout-test');
    });
  });

  describe('method connect()', function () {
    before(function (done) {
      // ensure _system database
      db.db.useDatabase('_system');

      // drop any test database
      db.drop('partout-test')
      .fail(function (err) {
        console.log('err:', err);
        err.code.should.equal(404);
      })
      .done(function () {
        done();
      });
    });

    it ('should exist', function () {
      should(db.connect).not.be.undefined;
    });

    it ('should be a function', function () {
      db.connect.should.be.a.function;
    });

    /*
     * test initial database creation on connect
     */
    var p_conn = db.connect();
    it ('should return a deferred promise', function () {
      p_conn.should.not.be.undefined;
      p_conn.should.be.a.Promise;
    });

    describe('returned promise', function () {
      it('should resolve action taken of created', function (cb) {
        p_conn
        .done(function (action_taken) {
          action_taken.should.equal('created');
          cb();
        });
      });
    });

  });

  describe('method getDb()', function () {
    it ('should exist', function () {
      should(db.getDb).not.be.undefined;
    });

    it ('should be a function', function () {
      db.getDb.should.be.a.function;
    });

    it ('should return a db object', function () {
      db.getDb().should.exist;
      db.getDb().should.be.an.Object;
    });

  });

});
