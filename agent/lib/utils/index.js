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
    UtilsEscapes = require('./escapes'),
    UtilsExecute = require('./execute'),
    UtilsLinux = require('./linux'),
    UtilsLogging = require('./logging'),
    UtilsString = require('./string'),
    UtilsValidations = require('./validations'),
    UtilsWindows = require('./windows');

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

  this.bannerInit();

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


// Mixin sub modules
_.mixin(Utils.prototype, UtilsAssertions.prototype);
_.mixin(Utils.prototype, UtilsBanner.prototype);
_.mixin(Utils.prototype, UtilsEscapes.prototype);
_.mixin(Utils.prototype, UtilsExecute.prototype);
_.mixin(Utils.prototype, UtilsLinux.prototype);
_.mixin(Utils.prototype, UtilsLogging.prototype);
_.mixin(Utils.prototype, UtilsString.prototype);
_.mixin(Utils.prototype, UtilsValidations.prototype);
_.mixin(Utils.prototype, UtilsWindows.prototype);

module.exports = new Utils(); // anonymous object
