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

/*global describe, it, should, before*/
var Q = require('q'),
    tmp = require('tmp'),
    fs = require('fs'),
    Policy = require('../../lib/policy'),
    u = require('util'),
    pfs = new (require('../../lib/pfs'))(),
    path = require('path'),
    utils = new (require('../../lib/utils'))(),
    os = require('os'),
    p2Test = require('../../lib/p2_test'),
    console = require('better-console'),
    linuxUser = require('linux-user');

GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;

// Simulate commandline options --verbose, --debug and --timing
GLOBAL.partout = {opts: {verbose: false, debug: false, timing: false}};

describe('Module user (nonpriviledged tests)', function () {

  var facts;

  before(function (done) {
    p2Test.getP2Facts()
    .done(function(newfacts) {
      facts = newfacts;
      done();
    });
  });

  //////////
  // facts
  it('should provide facts', function () {
    should(facts).not.be.undefined;
    should(facts.p2module).be.defined;
    should(facts.p2module.user).be.defined;
    facts.p2module.user.loaded.should.be.true;
  });

  if (os.platform() !== 'win32') {
    it('should provide facts for the root user', function () {
      //console.log('facts.users', facts.users);
      should(facts.users).not.be.undefined;
      should(facts.users.root).be.defined;
    });
  } else {
    it('should provide facts for the Administrator user', function () {
      //console.log('facts.users', facts.users);
      should(facts.users).not.be.undefined;
      should(facts.users.Administrator).be.defined;
    });
  }
});

describe('Module user (priviledged tests)', function () {

  ////////////
  // actions
  var isAdmin = false;
  before(function (done) {
    utils.pIsAdmin()
    .done(function (isA) {
      isAdmin = isA;
      done();
    });
  });

  //////////////////////////////
  // Put priviledged tests here

  var newUser = 'partouttest';
  if (os.platform() !== 'win32') {
    it('should create test user ' + newUser, function (done) {
      if (isAdmin) {
        p2Test.runP2Str(
          'p2\n' +
          '.user(\'{{{ newUser }}}\')',
          {
            newUser: newUser
          }
        )
        .then(function () {
          // check user created
          linuxUser.getUserInfo(newUser, function (err, userInfo) {
            if (err) {
              done(err);
              return;
            }
            //console.log('new user info:', userInfo);
            should(userInfo).not.be.undefined;
            userInfo.username.should.equal(newUser);

            //linuxUser.removeUser(newUser, function (err) {
            //  should(err).be.null;
              done();
            //});
          });
        })
        .done(null, function (err) {
          done(err);
        });
      } else {
        console.warn('Skipping tests for user module - lacking priviledges for test');
      }
    });

    it('should remove test user ' + newUser, function (done) {
      if (isAdmin) {
        p2Test.runP2Str(
          'p2\n' +
          '.user(\'{{{ newUser }}}\', {ensure: \'absent\'})',
          {
            newUser: newUser
          }
        )
        .then(function () {
          // check user created
          linuxUser.getUserInfo(newUser, function (err, userInfo) {
            should(err).be.null;
            should(userInfo).be.null;
            done();
          });
        })
        .done(null, function (err) {
          done(err);
        });
      } else {
        console.warn('Skipping tests for user module - lacking priviledges for test');
      }
    });

  }

});
