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
/*jshint multistr: true*/
'use strict';

var console = require('better-console'),
    walk = require('walk'),
    path = require('path'),
    fs = require('fs'),
    crypto = require('crypto'),
    mkdirp = require('mkdirp'),
    Q = require('q'),
    exec = require('child_process').exec,
    _ = require('lodash'),
    u = require('util');

Q.longStackSupport = true;

/**
 * Common utils
 * @constructor
 */
var Utils = function () {
  var self = this;

  self.banner = "\n\
'########:::::'###::::'########::'########::'#######::'##::::'##:'########:\n\
 ##.... ##:::'## ##::: ##.... ##:... ##..::'##.... ##: ##:::: ##:... ##..::\n\
 ##:::: ##::'##:. ##:: ##:::: ##:::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ########::'##:::. ##: ########::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##.....::: #########: ##.. ##:::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##:::::::: ##.... ##: ##::. ##::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##:::::::: ##:::: ##: ##:::. ##:::: ##::::. #######::. #######::::: ##::::\n\
..:::::::::..:::::..::..:::::..:::::..::::::.......::::.......::::::..:::::\n\
";

};

Utils.prototype.print_banner = function () {
  var self = this;
  console.info(self.banner);
};

Utils.prototype.getBanner = function () {
  var self = this;
  return self.banner;
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
 * @returns {object} Promise (obj[0,1]=stdout, stderr), rejects with error
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
 * Make a callback event object to be sent to the master
 * @param   {object} facts _impl.facts
 * @param   {object} o     {module:..., object:..., msg:...}
 * @returns {object} Populated callback object
 */
Utils.prototype.makeCallbackEvent = function (facts, o) {
  var self = this;
  self.dlog('DEPRECATED CALL to Utils.makeCallbackEvent() from:\nstack:\n' + (new Error()).stack);

  if (o) {
    return {
      agent_uuid: facts.partout_agent_uuid,
      hostname: facts.os_hostname,
      arch: facts.arch,
      platform: facts.platform,
      os_release: facts.os_release,
      os_family: facts.os_family,
      os_dist_name: facts.os_dist_name,
      os_dist_version_id: facts.os_dist_version_id,
      module: (o && o.module ? o.module : 'unknown'),
      object: (o && o.object ? o.object : 'unknown'),
      msg: (o && o.msg ? o.msg : 'Internal Agent Error> msg not provided to makeCallbackEvent() - stack:' + (new Error()).stack)
    };
  } else {
    return;
  }
};

/**
 * Module callback on completion of runAction() to continue to next step
 * @param {function} next_step_callback Next Step Callback in DSL
 * @param {object}   facts              _impl.facts
 * @param {object}   o                  Object with this event details: module:, object:, msg:.
 */
Utils.prototype.callbackEvent = function (next_step_callback, facts, o) {
  var self = this;
  if (o) {
    next_step_callback(self.makeCallbackEvent(facts, o));
  } else {
    next_step_callback();
  }
};

Utils.prototype.vlog = function () {
  var self = this;
  if (GLOBAL.partout.opts.verbose) {
    console.log('INFO:', u.format.apply(u, arguments));
  }
};

Utils.prototype.dlog = function () {
  var self = this;
  if (GLOBAL.partout.opts.debug) {
    console.log('DEBUG:', u.format.apply(u, arguments));
  }
};

module.exports = Utils;
