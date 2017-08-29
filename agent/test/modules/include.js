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

/*global describe, it, should */
var Q = require('q'),
    tmp = require('tmp'),
    fs = require('fs'),
    Policy = require('../../lib/policy'),
    u = require('util'),
    pfs = require('../../lib/pfs'),
    path = require('path'),
    utils = require('../../lib/utils'),
    os = require('os'),
    p2Test = require('../../lib/p2_test');

var should = require('should');

Q.longStackSupport = true;

// Simulate commandline options --verbose, --debug and --timing
global.partout = {opts: {verbose: false, debug: false, timing: false}};


describe('Module include', function () {

  it('Policy should create a role that can spawn command', function (done) {
    this.timeout(240000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST'),
        incFile = path.join(__dirname, 'include_test.p2');

    p2Test.runP2Str(
      'p2\n' +
      '.include(\'{{{ incFile }}}\')\n' +
      '.file(\'{{{ testFile }}}\', {ensure: \'absent\'})\n' +
      '._testRole_(\'MyTest\', {arg1: \'MyArgument1\', testFile: \'{{{ testFile }}}\'});',
      {
        testFile: testFile,
        incFile: incFile
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

});
