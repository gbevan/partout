/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*jslint node: true, nomen: true, vars: true*/
'use strict';

var console = require('better-console'),
  walk = require('walk'),
  path = require('path'),
  fs = require('fs'),
  crypto = require('crypto'),
  mkdirp = require('mkdirp'),
  Q = require('q'),
  exec = require('child_process').exec,
  _ = require('lodash');

Q.longStackSupport = true;

/**
 * Common utils
 * @constructor
 */
var Utils = function () {
};

/**
 * Execute a shell command and return the results in an array of lines
 * @param {String}  cmd Command to run
 * @returns {Promise} with err, lines, stderr
 */
Utils.prototype.execToArray = function (cmd) {
  var deferred = Q.defer();

  exec(cmd, function (err, stdout, stderr) {
    //console.log('stderr:', stderr);
    //console.log('stdout:', stdout);

    if (err) {
      //deferred.reject(err);
      deferred.reject({
        cmd: cmd,
        outlines: [],
        stdout: stdout,
        stderr: stderr,
        err: err,
        rc: (err ? err.code : -1)
      });
      return;
    }

    var lines = stdout.split(/\r?\n/),
      ret_lines = [];

    _.forEach(lines, function (line) {
      line = line.trim();
      if (line !== '') {
        ret_lines.push(line);
      }
    });

    deferred.resolve({
      cmd: cmd,
      outlines: ret_lines,
      stdout: stdout,
      stderr: stderr,
      err: err,
      rc: (err ? err.code : 0)
    });
  });

  return deferred.promise;
};

/**
 * Promisified exec
 * @param   {string} cmd Command to execute
 * @returns {object} Promise
 */
Utils.prototype.pExec = function (cmd) {
  return Q.nfcall(exec, cmd);
};

Utils.prototype.vetOps = function (module, opts, validopts) {
  var ok = true;
  _.forEach(opts, function (v, k) {
    if (!validopts[k]) {
      var err = new Error('[' + module + '] Invalid option: ' + k);
      console.error(err);
      ok = false;
    }
  });
  return ok;
};

/**
 * Module callback on completion of runAction() to continue to next step
 * @param {function} next_step_callback Next Step Callback in DSL
 * @param {object}   facts              _impl.facts
 * @param {object}   o                  Object with this event details: module:, object:, msg:.
 */
Utils.prototype.callbackEvent = function (next_step_callback, facts, o) {
  next_step_callback({
    agent_uuid: facts.partout_agent_uuid,
    hostname: facts.os_hostname,
    arch: facts.arch,
    platform: facts.platform,
    os_release: facts.os_release,
    os_family: facts.os_family,
    os_dist_name: facts.os_dist_name,
    os_dist_version_id: facts.os_dist_version_id,
    module: o.module,
    object: o.object,
    msg: o.msg
  });
};

module.exports = Utils;
