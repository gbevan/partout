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
GLOBAL.partout = {opts: {verbose: false, debug: false, timing: false}};

if (!utils.isWin()) {
  return;
}

var isAdmin = false;
utils.pIsAdmin()
.done(function (isA) {
  isAdmin = isA;

  if (!isAdmin) {
    return;
  }

  describe('Module service on windows', function () {

    var facts,
        cwd = process.cwd();

    before(function (done) {
      this.timeout(60000);
      p2Test.getP2Facts()
      .done(function(newfacts) {
        facts = newfacts;
        done();
      });
    });

    it('should provide services facts', function () {
      should(facts).not.be.undefined;
      should(facts.p2module).not.be.undefined;
      should(facts.p2module.service).not.be.undefined;
      facts.p2module.service.loaded.should.be.true;
      // TODO: should(facts.services).not.be.undefined;
    });

    if (utils.isWin()) {

      /*
       * Test the lifecycle of a windows service,
       * through creation, enabling, running, stopping, disabling and deleting.
       */
      var srv_path = path.join(cwd, 'test', 'modules', 'files', 'hello_world_service.js'),
          nssm_path = path.join('C:', 'partout_test', 'nssm.exe');

      // Create the windows service (powershell 5.0)
      it('should create the PartoutHelloWorld service', function (done) {
        this.timeout(20000);

        // delete dummy service / make nssm available locally for the test
        utils.runPs(
          //'net use U: \\\\192.168.0.64\\partout_agent; ' +
          '$tPath = "C:\\partout_test";' +
          'if (!(Test-Path $tPath)) { md $tPath; };' +
          'if (!(Test-Path "$tPath\\nssm.exe")) { copy P:\\test\\modules\\files\\64\\nssm.exe $tPath; };' +
          'if (!(Test-Path "$tPath\\hello_world_service.js")) { copy P:\\test\\modules\\files\\hello_world_service.js $tPath; };' +
          'cd $tPath;' +
          '& "C:\\Program Files\\nodejs\\npm" install express;' +
          'Set-Service -Name PartoutHelloWorld -Status "Stopped";' +
          '(Get-WmiObject -Class Win32_Service -Filter "Name=\'PartoutHelloWorld\'").delete();'
        )
        .done(function (res) {
          //console.log('pre setup & delete service res:', res);

          // TODO: Review appdir, application and appparams as they may be specific to nssm used in unit-test
          p2Test.runP2Str(
            'p2\n' +
            '.service(\'PartoutHelloWorld\', {\n' +
            '   description: \'Hello World from Partout\',' +
            '   exec: \'{{ nssm_path }}\',' +
            '   appdir: \'C:\\partout_test\',' +
            '   application: \'C:\\Program Files\\nodejs\\node.exe\',' +
            '   appparams: \'C:\\partout_test\\hello_world_service.js\',' +
            '   enabled: false' +
            '});',
            {
              nssm_path: nssm_path
              //srv_path: srv_path
            }
          )
          .then(function () {
            utils.runPs('Get-WmiObject -Class Win32_Service -Filter "Name=\'PartoutHelloWorld\'" | ConvertTo-Json -compress')
            .then(function (res) {
              //console.log('service res:', res);
              var rc = res[0],
                  stdout = res[1],
                  stderr = res[2],
                  res_obj = (stdout ? JSON.parse(stdout) : {});
              rc.should.equal(0);
              //console.log('res_obj:', res_obj);
              //console.log('res_obj.StartMode:', res_obj.StartMode);
              //console.log('res_obj.State:', res_obj.State);
              res_obj.should.not.eql({});
              //should(res_obj.StartMode).not.be.undefined;
              res_obj.should.hasOwnProperty('StartMode');
              res_obj.StartMode.should.equal('Disabled');
              res_obj.State.should.equal('Stopped');

              done();
            })
            .done(null, function (err) {
              done(err);
            });
          });
          //.done(null, function (err) {
          //  done(err);
          //});
        }); // delete service before test
      });

      it('should set service StartMode to Manual if enabled', function (done) {
        this.timeout(20000);
        p2Test.runP2Str(
          'p2\n' +
          '.service(\'PartoutHelloWorld\', {\n' +
          '   enabled: true' +
          '});',
          {}
        )
        .then(function () {
          utils.runPs('Get-WmiObject -Class Win32_Service -Filter "Name=\'PartoutHelloWorld\'" | ConvertTo-Json -compress')
          .then(function (res) {
            //console.log('service res:', res);
            var rc = res[0],
                stdout = res[1],
                stderr = res[2],
                res_obj = (stdout ? JSON.parse(stdout) : {});
            rc.should.equal(0);
            //console.log('res_obj:', res_obj);
            //console.log('res_obj.StartMode:', res_obj.StartMode);
            //console.log('res_obj.State:', res_obj.State);
            res_obj.should.not.eql({});
            res_obj.should.hasOwnProperty('StartMode');
            res_obj.StartMode.should.equal('Auto');
            res_obj.State.should.equal('Stopped');

            done();
          })
          .done(null, function (err) {
            done(err);
          });
        });
      });

      it('should set service StartMode to Disabled if enabled=false', function (done) {
        this.timeout(20000);
        p2Test.runP2Str(
          'p2\n' +
          '.service(\'PartoutHelloWorld\', {\n' +
          '   enabled: false' +
          '});',
          {}
        )
        .then(function () {
          utils.runPs('Get-WmiObject -Class Win32_Service -Filter "Name=\'PartoutHelloWorld\'" | ConvertTo-Json -compress')
          .then(function (res) {
            //console.log('service res:', res);
            var rc = res[0],
                stdout = res[1],
                stderr = res[2],
                res_obj = (stdout ? JSON.parse(stdout) : {});
            rc.should.equal(0);
            //console.log('res_obj:', res_obj);
            //console.log('res_obj.StartMode:', res_obj.StartMode);
            //console.log('res_obj.State:', res_obj.State);
            res_obj.should.not.eql({});
            res_obj.should.hasOwnProperty('StartMode');
            res_obj.StartMode.should.equal('Disabled');
            res_obj.State.should.equal('Stopped');

            done();
          })
          .done(null, function (err) {
            done(err);
          });
        });
      });

      it('should set service StartMode to Manual if enabled=Manual', function (done) {
        this.timeout(20000);
        p2Test.runP2Str(
          'p2\n' +
          '.service(\'PartoutHelloWorld\', {\n' +
          '   enabled: "Manual"' +
          '});',
          {}
        )
        .then(function () {
          utils.runPs('Get-WmiObject -Class Win32_Service -Filter "Name=\'PartoutHelloWorld\'" | ConvertTo-Json -compress')
          .then(function (res) {
            //console.log('service res:', res);
            var rc = res[0],
                stdout = res[1],
                stderr = res[2],
                res_obj = (stdout ? JSON.parse(stdout) : {});
            rc.should.equal(0);
            //console.log('res_obj:', res_obj);
            //console.log('res_obj.StartMode:', res_obj.StartMode);
            //console.log('res_obj.State:', res_obj.State);
            res_obj.should.not.eql({});
            res_obj.should.hasOwnProperty('StartMode');
            res_obj.StartMode.should.equal('Manual');
            res_obj.State.should.equal('Stopped');

            done();
          })
          .done(null, function (err) {
            done(err);
          });
        });
      });

      it('should set service Status to Running if ensure=true', function (done) {
        this.timeout(20000);
        p2Test.runP2Str(
          'p2\n' +
          '.service(\'PartoutHelloWorld\', {\n' +
          '   ensure: true' +
          '});',
          {}
        )
        .then(function () {
          utils.runPs('Get-WmiObject -Class Win32_Service -Filter "Name=\'PartoutHelloWorld\'" | ConvertTo-Json -compress')
          .then(function (res) {
            //console.log('service res:', res);
            var rc = res[0],
                stdout = res[1],
                stderr = res[2],
                res_obj = (stdout ? JSON.parse(stdout) : {});
            rc.should.equal(0);
            //console.log('res_obj:', res_obj);
            //console.log('res_obj.StartMode:', res_obj.StartMode);
            //console.log('res_obj.State:', res_obj.State);
            res_obj.should.not.eql({});
            res_obj.should.hasOwnProperty('StartMode');
            res_obj.StartMode.should.equal('Manual');
            res_obj.State.should.equal('Running');

            done();
          })
          .done(null, function (err) {
            done(err);
          });
        });
      });

      it('should delete the service is enabled=Deleted', function (done) {
        this.timeout(20000);
        p2Test.runP2Str(
          'p2\n' +
          '.service(\'PartoutHelloWorld\', {\n' +
          '   enabled: "Deleted"' +
          '});',
          {}
        )
        .then(function () {
          utils.runPs('Get-WmiObject -Class Win32_Service -Filter "Name=\'PartoutHelloWorld\'" | ConvertTo-Json -compress')
          .then(function (res) {
            //console.log('service res:', res);
            var rc = res[0],
                stdout = res[1],
                stderr = res[2],
                res_obj = (stdout ? JSON.parse(stdout) : {});
            rc.should.equal(0);
            //console.log('res_obj:', res_obj);
            //console.log('res_obj.StartMode:', res_obj.StartMode);
            //console.log('res_obj.State:', res_obj.State);
            res_obj.should.eql({});
            res_obj.should.not.hasOwnProperty('StartMode');

            done();
          })
          .done(null, function (err) {
            done(err);
          });
        });
      });

    } // isWin?

  });

}); // isAdmin
