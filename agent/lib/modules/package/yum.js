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

var console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Q = require('q'),
    rpm = require('./rpm');

Q.longStackSupport = true;

var Package = function () {

};

/**
 * @description
 * Package module
 * ==============
 *
 *    p2.package(
 *      'title or pkg name',
 *      options,
 *      function (err, stdout, stderr) {
 *        ... to be called after exec of pkg command ...
 *      }
 *    )
 *
 * Options:
 *   | Operand    | Type    | Description                                                |
 *   |:-----------|---------|:-----------------------------------------------------------|
 *   | name       | String  | Package name to install (defaults to title) |
 *   | ensure     | String  | present/installed, absent/purged, latest (default is present) |
 *
 */

Package.runAction = function (_impl, next_step_callback, title, opts, command_complete_cb) {
  var self = this;
  //console.log('package action self:', self);
  //console.log('package redhat arguments:', arguments);
  //console.log('package action called next_step_callback:', next_step_callback);

  // Get current status and version from rpm
  rpm.getStatus(opts.name)
  .then(function (current_state) {
    //console.log('current_state:', current_state);

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
          next_step_callback({
            module: 'package',
            object: opts.name,
            msg: 'install ' + (err ? err : 'ok')
          });
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
              next_step_callback({
                module: 'package',
                object: opts.name,
                msg: 'upgrade ' + (err ? err : 'ok')
              });
            });
          } else {
            next_step_callback();
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
          next_step_callback({
            module: 'package',
            object: opts.name,
            msg: 'uninstall ' + (err ? err : 'ok')
          });
        });

      } else {
        next_step_callback();
      }

    } else {
      console.error('package module does not support ensure option value of:', opts.ensure);
      next_step_callback();
    }

  }) // current_state
  .done();
};

Package.getFacts = function (facts_so_far) {
  var self = this;

  // get installed packages for this OS from rpm.js

  return rpm.getFacts(facts_so_far);
};

module.exports = Package;
