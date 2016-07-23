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

/*global describe, it, should*/
var Q = require('q'),
    tmp = require('tmp'),
    fs = require('fs'),
    Policy = require('../../lib/policy'),
    u = require('util'),
    pfs = new (require('../../lib/pfs'))(),
    path = require('path'),
    utils = new (require('../../lib/utils'))(),
    os = require('os'),
    p2Test = require('../../lib/p2_test');

global.should = require('should');
should.extend();

Q.longStackSupport = true;

// Simulate commandline options --verbose, --debug and --timing
global.partout = {opts: {verbose: false, debug: false, timing: false}};


describe('Module file', function () {

  describe('option ensure', function () {
    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    it('Policy should create file if ensure is present and no filter', function (done) {
      this.timeout(10000);

      p2Test.runP2Str(
        'p2\n' +
        '.file(\'{{{ testFile }}}\', {ensure: \'present\'});',
        {
          testFile: testFile
        }
      )
      .then(function () {
        return pfs.pExists(testFile);
      })
      .then(function (exists) {
        exists.should.be.true;
        return pfs.pUnlink(testFile);
      })
      .then(function (err) {
        should(err).be.undefined;
        done();
      })
      .done(null, function (err) {
        done(err);
      });
    });

    it('Policy should remove file if ensure is absent and no filter', function (done) {

      p2Test.runP2Str(
        'p2\n' +
        '.file(\'{{{ testFile }}}\', {ensure: \'absent\'});',
        {
          testFile: testFile
        }
      )
      .then(function () {
        return pfs.pExists(testFile);
      })
      .then(function (exists) {
        exists.should.be.false;
        if (exists) {
          return pfs.pUnlink(testFile);
        } else {
          return Q();
        }
      })
      .then(function (err) {
        should(err).be.undefined;
        done();
      })

      .done(null, function (err) {
        done(err);
      });
    });

  }); // ensure

  describe('option content', function () {

    it('Policy should create file with content string', function (done) {
      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

      p2Test.runP2Str(
        'p2\n' +
        '.file(\'{{{ testFile }}}\', {ensure: \'present\', content: \'TEST CONTENT\'});',
        {
          testFile: testFile
        }
      )
      .then(function () {
        return pfs.pExists(testFile);
      })
      .then(function (exists) {
        exists.should.be.true;
        return pfs.pReadFile(testFile);
      })
      .then(function (data) {
        data = data.toString().trim();
        data.should.equal('TEST CONTENT');
        return pfs.pUnlink(testFile);
      })
      .then(function (err) {
        should(err).be.undefined;
        done();
      })

      .done(null, function (err) {
        done(err);
      });
    });

    it('Policy should create file with template string', function (done) {
      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

      p2Test.runP2Str(
        'p2\n' +
        '.file(\'{{{ testFile }}}\', {ensure: \'present\', content: \'{{{ template }}}\', is_template: true});',
        {
          testFile: testFile,
          template: '{{ f.platform }}'
        }
      )
      .then(function () {
        return pfs.pExists(testFile);
      })
      .then(function (exists) {
        exists.should.be.true;
        return pfs.pReadFile(testFile);
      })
      .then(function (data) {
        data = data.toString().trim();
        data.should.equal(os.platform());
        return pfs.pUnlink(testFile);
      })
      .then(function (err) {
        should(err).be.undefined;
        done();
      })

      .done(null, function (err) {
        done(err);
      });
    });

  }); // content

});
