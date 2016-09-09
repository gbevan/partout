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
    spawn = require('child_process').spawn,
    _ = require('lodash'),
    u = require('util'),
    os = require('os'),
    UtilsAssertions = require('./assertions'),
    UtilsBanner = require('./banner'),
    UtilsLogging = require('./logging'),
    UtilsExecute = require('./execute');

Q.longStackSupport = true;

/**
 * Common utils (returns an anonymouse object, instance of internal class Utils)
 *
 * ```
 * var utils = p2.require('utils');
 * utils.vlog('verbose message');
 * ```
 * @constructor Utils
 * @mixes UtilsAssertions
 * @mixes UtilsBanner
 * @mixes UtilsExecute
 * @mixes UtilsLogging
 */
var Utils = function () {

  if (!(this instanceof Utils)) {
    return new Utils();
  }

};


/**
 * Test if current node version is at a minimum version
 * @param   {number}  ver Major Node version to test as minimum
 * @returns {boolean} true/false
 */
Utils.prototype.minNodeVersion = function (ver) {
  var maj = (process.versions.node.split(/\./))[0] * 1;

  return (maj >= ver);
};

/**
 * Syncronous function to read and parse /etc/os-release on linux os's
 * Used in unit-tests.
 * @returns {object} parsed contents of os-release as an object of key/value pairs
 */
Utils.prototype.get_linux_os_release_Sync = function () {
  var self = this;

  if (!self.isLinux()) {
    return;
  }

  var os_rel;
  try {
    os_rel = fs.readFileSync('/etc/os-release').toString();
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
    throw e;
  }

  if (!os_rel) {
    return;
  }

  var os_lines = os_rel.split(/\r?\n/),
      os_obj = {};
  os_lines.forEach(function (os_line) {
    var m = os_line.match(/^(\w+)="*?([^"]*)"*?/);
    if (m) {
      os_obj[m[1]] = m[2];
    }
  });

  return os_obj;
};

/**
 * Syncronous test for Debian OS.
 * Used in unit tests.
 * @returns {boolean} true if debian
 */
Utils.prototype.isDebianSync = function () {
  var self = this;

  var os_obj = self.get_linux_os_release_Sync();

  return os_obj && os_obj.ID_LIKE === 'debian';
};


/**
 * Get Powershell version
 * @returns {object} Object returned from $PSVersionTable e.g.: {PSVersion: {Major: 5, ...}, ...}
 */
Utils.prototype.getPsVersion = function () {
  var self = this,
      deferred = Q.defer();

  self.runPs('$PSVersionTable | ConvertTo-Json -compress')
  .done(function (res) {
    var rc = res[0],
        stdout = res[1],
        stderr = res[2],
        psVersion = (stdout ? JSON.parse(stdout) : {'PSVersion' : {'Major': -1}});
    deferred.resolve(psVersion);
  });

  return deferred.promise;
};

/**
 * Validate options object
 * @param   {string}  module    Module name
 * @param   {object}  opts      Options to be validated
 * @param   {object}  validopts Options to validate against
 * @returns {boolean} Options passed validation true/false
 */
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

Utils.prototype.escapeBackSlash = function (s) {
  return s.replace(/\\/g, '\\\\');
};

Utils.prototype.winEscapeSpaces = function (s) {
  return s.replace(/ /g, '^ ');
};

Utils.prototype.pIsAdmin = function () {
  var self = this,
      deferred = Q.defer();

  if (os.platform() === 'win32') {
    self.pExec('NET SESSION')
    .fail(function (err) {
      //console.error('pIsAdmin() NET SESSION err:', err);
      deferred.resolve(false);
    })
    .done(function (res) {
      var stdout = res[0],
          stderr = res[1];

      //console.log('pIsAdmin() NET SESSION stdout:', stdout);
      //console.log('pIsAdmin() NET SESSION stderr:', stderr);

      deferred.resolve(stderr.length === 0);
    });

  } else {
    deferred.resolve((process.geteuid ? process.geteuid() : process.getuid()) === 0);
  }

  return deferred.promise;
};

/**
 * util func to split a string into an array of lines
 */
Utils.prototype.splitLines = function (str) {
  return str.split(/\r?\n/g);
};


// Mixin sub modules
_.mixin(Utils.prototype, UtilsAssertions.prototype);
_.mixin(Utils.prototype, UtilsBanner.prototype);
_.mixin(Utils.prototype, UtilsExecute.prototype);
_.mixin(Utils.prototype, UtilsLogging.prototype);

module.exports = new Utils(); // anonymous object
