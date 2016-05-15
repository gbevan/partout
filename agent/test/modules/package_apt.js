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
    pfs = new (require('../../lib/pfs'))(),
    path = require('path'),
    utils = new (require('../../lib/utils'))(),
    os = require('os'),
    p2Test = require('../../lib/p2_test'),
    console = require('better-console');


GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;

// Simulate commandline options --verbose, --debug and --timing
//GLOBAL.partout = {opts: {verbose: false, debug: true, timing: false}};

var isAdmin = false;

utils.pIsAdmin()
.then(function (isA) {
  isAdmin = isA;
  return p2Test.getP2Facts();
})
.done(function(facts) {
  //console.log('package_apt: facts:', facts);
  if (!isAdmin) {
    return;
  }

  describe('Module package with apt provider', function () {

    var cwd = process.cwd();

    /*
    it('should provide services facts', function () {
      should(facts).not.be.undefined;
      should(facts.p2module).not.be.undefined;
      should(facts.p2module.service).not.be.undefined;
      facts.p2module.service.loaded.should.be.true;
      // TODO: should(facts.services).not.be.undefined;
      //console.log('facts:', facts);
    });
    */

    if (facts.os_family === 'debian') {
      var pkg = 'lolcat';

      it('should install package ' + pkg, function (done) {
        this.timeout(120000);
        //console.log('package_apt debian');

        GLOBAL.partout = {opts: {verbose: false, debug: false, timing: false}};

        p2Test.runP2Str(
          'p2\n' +
          '.package(\'' + pkg + '\', {\n' +
          '  ensure: \'absent\'' +
          '});'
        )
        .then(function (res_absent) {
          //console.log('made absent');

          p2Test.runP2Str(
            'p2\n' +
            '.package(\'' + pkg + '\', {\n' +
            '  ensure: \'present\'' +
            '});'
          )
          .then(function (res_present) {
            //console.log('made present');

            p2Test.getP2Facts()
            .then(function(facts) {
              //console.log('got facts');
              GLOBAL.partout = {opts: {verbose: false, debug: false, timing: false}};
              should(facts).not.be.undefined;
              should(facts.installed_packages).not.be.undefined;
              //console.log('facts.installed_packages ' + pkg + ':', facts.installed_packages[pkg]);
              should(facts.installed_packages[pkg]).not.be.undefined;

              //console.log('facts ok calling done()');
              done();
            })
            .done(null, function (err) {
              done(err);
            });
          });
        })
        .done(null, function (err) {
          done(err);
        });
      });

      it('should uninstall package ' + pkg, function (done) {
        this.timeout(120000);
        //console.log('package_apt debian');

        p2Test.runP2Str(
          'p2\n' +
          '.package(\'' + pkg + '\', {\n' +
          '  ensure: \'absent\'' +
          '});'
        )
        .then(function (res_absent) {
          //console.log('made absend');

          p2Test.getP2Facts()
          .then(function(facts) {
            should(facts).not.be.undefined;
            should(facts.installed_packages).not.be.undefined;
            should(facts.installed_packages.nginx).be.undefined;

            done();
          });
        })
        .done(null, function (err) {
          done(err);
        });
      });

    }

  });

});

