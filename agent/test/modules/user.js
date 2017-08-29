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

/*global describe, it, should, before, run*/
var Q = require('q'),
    tmp = require('tmp'),
    fs = require('fs'),
    Policy = require('../../lib/policy'),
    u = require('util'),
    pfs = require('../../lib/pfs'),
    path = require('path'),
    utils = require('../../lib/utils'),
    os = require('os'),
    p2Test = require('../../lib/p2_test'),
    console = require('better-console'),
    passwd, PUser;

if (process.platform === 'linux') {
  passwd = require('passwd-group-obj').passwd;
  PUser = require('passwd-group-obj').PUser;
}

var should = require('should');

Q.longStackSupport = true;

// Simulate commandline options --verbose, --debug and --timing
global.partout = {opts: {verbose: false, debug: false, timing: false}};

var isAdmin = false;
utils.pIsAdmin()
.done(function (isA) {
  isAdmin = isA;

  describe('Module user', function () {

    describe('(nonpriviledged tests)', function () {

      var facts;

      before(function (done) {
        this.timeout(60000);
        p2Test.getP2Facts()
        .then(function(newfacts) {
          facts = newfacts;
          done();
        })
        .done(null, function (err) {
          done(err);
        });
      });

      //////////
      // facts
      it('should provide facts', function () {
        should(facts).not.be.undefined();
        should(facts.users).not.be.undefined();
      });

      if (os.platform() !== 'win32') {
        it('should provide facts for the root user', function () {
          should(facts.users).not.be.undefined;
          should(facts.users.root).be.defined;
        });
        it('should provide facts for the root user cleansed', function () {
          facts.users.root.should.not.be.an.instanceof(PUser);
        });
      } else {
        it('should provide facts for the Administrator user', function () {
          should(facts.users).not.be.undefined;
          should(facts.users.Administrator).be.defined;
        });
      }
    });

    describe('(priviledged tests)', function () {

      ////////////
      // actions

      if (!isAdmin) {
        it ('should skip user module tests when lacking required priviledges', function () { });
        return;
      }

      //////////////////////////////
      // Put priviledged tests here

      var newUser = 'partouttest';

      if (process.platform === 'linux') {

        it('should create test user ' + newUser, function (done) {
          this.timeout(20000);
          p2Test.runP2Str(
            'p2\n' +
            '.user(\'{{{ newUser }}}\')',
            {
              newUser: newUser
            }
          )
          .then(function () {
            // check user created
            return passwd.$loadUsers()
            .then(function () {
              should(passwd[newUser]).not.be.undefined();
              should(passwd[newUser].name).not.be.undefined();
              passwd[newUser].name.should.eql(newUser);
              done();
            });
          })
          .done(null, function (err) {
            done(err);
          });
        });

        it('should remove test user ' + newUser, function (done) {
          this.timeout(20000);
          p2Test.runP2Str(
            'p2\n' +
            '.user(\'{{{ newUser }}}\', {ensure: \'absent\'})',
            {
              newUser: newUser
            }
          )
          .then(function () {
            return passwd.$loadUsers()
            .then(function () {
              should(passwd[newUser]).be.undefined();
              done();
            });
          })
          .done(null, function (err) {
            done(err);
          });
        });

      } else if (process.platform === 'win32') {

        it('should create test user ' + newUser, function (done) {
          this.timeout(20000);
          p2Test.runP2Str(
            'p2\n' +
            //'.user(\'{{{ newUser }}}\', {ensure: \'absent\'})\n',
            '.user(\'{{{ newUser }}}\')',
            {
              newUser: newUser
            }
          )
          .then(function () {
            // check user created
//            return passwd.$loadUsers()
//            .then(function () {
//              should(passwd[newUser]).not.be.undefined();
//              should(passwd[newUser].name).not.be.undefined();
//              passwd[newUser].name.should.eql(newUser);
//              done();
//            });

            return utils.runPs('Get-WmiObject -Class Win32_UserAccount | ConvertTo-Json -compress')
            .then(function (res) {
              console.log('create user res:', res);
              var rc = res[0],
                  stdout = res[1],
                  stderr = res[2],
                  res_array = JSON.parse(stdout),
                  users = {};

              res_array.forEach(function (u) {
                users[u.Name] = u;
              });

              //users.should.have.ownProperty(newUser);
              should(users[newUser]).not.be.undefined();
              console.log(newUser, ':', users[newUser]);

              done();
            });

          })
          .done(null, function (err) {
            done(err);
          });
        });

        it('should remove test user ' + newUser, function (done) {
          this.timeout(20000);
          p2Test.runP2Str(
            'p2\n' +
            '.user(\'{{{ newUser }}}\', {ensure: \'absent\'})',
            {
              newUser: newUser
            }
          )
          .then(function () {
//            return passwd.$loadUsers()
//            .then(function () {
//              should(passwd[newUser]).be.undefined();
//              done();
//            });

            return utils.runPs('Get-WmiObject -Class Win32_UserAccount | ConvertTo-Json -compress')
            .then(function (res) {
              var rc = res[0],
                  stdout = res[1],
                  stderr = res[2],
                  res_array = JSON.parse(stdout),
                  users = {};

              res_array.forEach(function (u) {
                users[u.Name] = u;
              });

              //users.should.have.ownProperty(newUser);
              should(users[newUser]).be.undefined();
              done();
            });

          })
          .done(null, function (err) {
            done(err);
          });
        });

      }

    });

    //run();
  }); // outer describe

}); // isAdmin
