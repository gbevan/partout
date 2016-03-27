/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*jslint node: true, nomen: true */
'use strict';

var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Q = require('q'),
    rpm = new (require('./rpm'))(),
    utils = new (require('../../utils'))();

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

var Package = P2M.Module(module.filename, function () {
   var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  //.name('Facts')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var self = this;
    utils.dlog('in package yum facts()');

    // get installed packages for this OS from rpm.js
    deferred.resolve(rpm.getFacts(facts_so_far));
  })

  ///////////////
  // Run Action
  .action(function (args) {

    var deferred = args.deferred,
        //inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '';

    utils.dlog('Package yum: in action ############################ name:', opts.name, 'ensure:', opts.ensure);

    // Get current status and version from rpm
    rpm.getStatus(opts.name)
    .then(function (current_state) {
      utils.dlog('Package yum: current_state:', current_state);

      // PRESENT / INSTALLED / LATEST
      if (opts.ensure.match(/^(present|installed|latest)$/)) {

        if (!current_state) { // not installed
          console.info('Installing package:', opts.name);

          exec('yum -y install -y ' + opts.name, function (err, stdout, stderr) {
            if (err) {
              console.error('yum install failed:', err, stderr);
            } else {
              // add to facts
              _impl.facts.installed_packages[opts.name] = {};  // next facts run will populate
            }
            if (command_complete_cb) command_complete_cb(err, stdout, stderr);
//            utils.callbackEvent(next_step_callback, _impl.facts, {
//              module: 'package',
//              object: opts.name,
//              msg: 'install ' + (err ? err : 'ok')
//            });
            _impl.qEvent({
              module: 'package',
              object: opts.name,
              msg: 'install ' + (err ? err : 'ok')
            });
            deferred.resolve();
          });

        } else if (opts.ensure === 'latest') {
          // LATEST
          exec('yum -q check-updates ' + opts.name + ' | tail -n +2', function (err, stdout, stderr) {
            if (err) {
              console.error('yum check-updates failed:', err, stderr);
            }
            var line = stdout.trim();

            if (line !== '') { // update available?
              console.info('Upgrading package:', opts.name);
              exec('yum -y update ' + opts.name, function (err, stdout, stderr) {
                if (err) {
                  console.error('yum update failed:', err, stderr);
                }
                if (command_complete_cb) command_complete_cb(err, stdout, stderr);
//                utils.callbackEvent(next_step_callback, _impl.facts, {
//                  module: 'package',
//                  object: opts.name,
//                  msg: 'upgrade ' + (err ? err : 'ok')
//                });
                _impl.qEvent({
                  module: 'package',
                  object: opts.name,
                  msg: 'upgrade ' + (err ? err : 'ok')
                });
                deferred.resolve();
              });
            } else {
              //next_step_callback();
              deferred.resolve();
            }
          });
        }

      } else if (opts.ensure.match(/^(absent|purged)$/)) {
        // ABSENT / PURGED

        if (current_state) { // installed?y
          console.info('Removing package:', opts.name);

          exec('yum -y erase ' + opts.name, function (err, stdout, stderr) {
            if (err) {
              console.error('yum erase failed:', err, stderr);
            } else {
              delete _impl.facts.installed_packages[opts.name];
            }
            if (command_complete_cb) command_complete_cb(err, stdout, stderr);
//            utils.callbackEvent(next_step_callback, _impl.facts, {
//              module: 'package',
//              object: opts.name,
//              msg: 'uninstall ' + (err ? err : 'ok')
//            });
            _impl.qEvent({
              module: 'package',
              object: opts.name,
              msg: 'uninstall ' + (err ? err : 'ok')
            });
            deferred.resolve();
          });

        } else {
//          next_step_callback();
          deferred.resolve();
        }

      } else {
        console.error('package module does not support ensure option value of:', opts.ensure);
//        next_step_callback();
        deferred.resolve();
      }

    }) // current_state
    .done();

  }, {immediate: true}); // action

});


module.exports = Package;
