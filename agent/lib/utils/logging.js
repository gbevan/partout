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

/*jslint node: true, nomen: true, vars: true*/
/*jshint multistr: true*/
'use strict';

var console = require('better-console'),
    u = require('util');

/**
 * Logging utils
 *
 * @mixin
 */
var UtilsLogging = function () {

};

/**
 * Verbose log, same arguments as console.log
 */
UtilsLogging.prototype.vlog = function () {
  var self = this;
  if (global.partout.opts.verbose) {
    console.log('INFO:', u.format.apply(u, arguments));
  }
};

/**
 * debug log, same arguments as console.log
 */
UtilsLogging.prototype.dlog = function () {
  var self = this;
  if (global.partout.opts.debug) {
    console.log('DEBUG:', u.format.apply(u, arguments));
  }
};

/**
 * Start labelled timer, complete log the time taken by calling tloge(label).
 * @param {string} label Label for the timer
 */
UtilsLogging.prototype.tlogs = function (label) {
  var self = this;
  if (global.partout.opts.timing) {
    console.time(label);
  }
};

/**
 * End labelled timer (see tlogs()).
 * @param {string} label Label for the timer
 */
UtilsLogging.prototype.tloge = function (label) {
  var self = this;
  if (global.partout.opts.timing) {
    console.timeEnd(label);
  }
};

module.exports = UtilsLogging;
