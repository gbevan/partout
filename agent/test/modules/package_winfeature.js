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

if (!utils.isWin()) {
  return;
}

var isAdmin = false,
    facts = {};

before(function(done) {
  this.timeout(60000);
  utils.pIsAdmin()
  .then(function (isA) {
    isAdmin = isA;

    return p2Test.getP2Facts()
    .then(function (p2TestFacts) {
      facts = p2TestFacts;
      done();
    });

  })
  .done(null, function (err) {
    console.error('package_winfeature err:', err);
    console.warn('stack:', err.stack);
    done(err);
  });
});

describe('package_winfeature', function () {

  it('should provide winfeature package facts', function () {
    should(facts).not.be.undefined();
    should(facts.installed_winfeature_packages).not.be.undefined();
  });

  if (!isAdmin) {
    return;
  }

  describe('Module package with winfeature provider', function () {

    var cwd = process.cwd();

    var pkg = 'TelnetClient';

    it('should install package feature ' + pkg, function (done) {
      this.timeout(60000);

      p2Test.runP2Str(
        'p2\n' +
        '.package(\'' + pkg + '\', {\n' +
        '  provider: \'winfeature\',\n' +
        '  ensure: \'absent\'' +
        '});'
      )
      .then(function (res_absent) {
        console.log('made absent');

        p2Test.runP2Str(
          'p2\n' +
          '.package(\'' + pkg + '\', {\n' +
          '  provider: \'winfeature\',\n' +
          '  ensure: \'present\'' +
          '});'
        )
        .then(function (res_present) {
          console.log('made present');

          p2Test.getP2Facts()
          .then(function(facts) {
            should(facts).not.be.undefined;
            should(facts.installed_winfeature_packages).not.be.undefined;
            console.log('facts.installed_winfeature_packages ' + pkg + ':', facts.installed_winfeature_packages[pkg]);
            should(facts.installed_winfeature_packages[pkg]).not.be.undefined;
            facts.installed_winfeature_packages[pkg].status.should.equal('Enabled');

            done();
          })
          .done(null, function (err) {
            done(err);
          });
        })
        .done(null, function (err) {
          done(err);
        });
      })
      .done(null, function (err) {
        done(err);
      });
    });

    it('should uninstall package ' + pkg, function (done) {
      this.timeout(60000);

      p2Test.runP2Str(
        'p2\n' +
        '.package(\'' + pkg + '\', {\n' +
        '  provider: \'winfeature\',\n' +
        '  ensure: \'absent\'' +
        '});'
      )
      .then(function (res_absent) {

        p2Test.getP2Facts()
        .then(function(facts) {
          should(facts).not.be.undefined;
          should(facts.installed_winfeature_packages).not.be.undefined;
          if (facts.installed_winfeature_packages[pkg]) {
            should(facts.installed_winfeature_packages[pkg].status).not.be.undefined;
            console.log('facts.installed_winfeature_packages ' + pkg + ':', facts.installed_winfeature_packages[pkg]);
            facts.installed_winfeature_packages[pkg].status.should.equal('Disabled');
          } else {
            should(facts.installed_winfeature_packages[pkg]).be.undefined;
          }

          done();
        })
        .done(null, function (err) {
          done(err);
        });
      })
      .done(null, function (err) {
        done(err);
      });
    });

  }); // describe package winfeature

});

