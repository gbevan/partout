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
    console = require('better-console');


global.should = require('should');
should.extend();

Q.longStackSupport = true;

// Simulate commandline options --verbose, --debug and --timing
global.partout = {opts: {verbose: false, debug: false, timing: false}};

var isAdmin = false;
utils.pIsAdmin()
.done(function (isA) {
  isAdmin = isA;

  describe('Module service', function () {

    var facts,
        cwd = process.cwd();

    before(function (done) {
      this.timeout(60000);
      p2Test.getP2Facts()
      .then(function(newfacts) {
        facts = newfacts;
        done();
      })
      .done(null, function (err) {
        should(err).be.undefined;
        done(err);
      });
    });

    it('should provide services facts', function () {
      should(facts).not.be.undefined;
      should(facts.p2module).not.be.undefined;
      should(facts.p2module.service).not.be.undefined;
      facts.p2module.service.loaded.should.be.true;
      // TODO: should(facts.services).not.be.undefined;
    });


  });

}); // isAdmin
