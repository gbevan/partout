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
    fs = require('fs'),
    u = require('util');

/**
 * Assertions utils
 *
 * @mixin
 */
var UtilsLinux = function () {

};

/**
 * Syncronous function to read and parse /etc/os-release on linux os's
 * Used in unit-tests.
 * @returns {object} parsed contents of os-release as an object of key/value pairs
 */
UtilsLinux.prototype.get_linux_os_release_Sync = function () {
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
UtilsLinux.prototype.isDebianSync = function () {
  var self = this;

  var os_obj = self.get_linux_os_release_Sync();

  return os_obj && os_obj.ID_LIKE === 'debian';
};

module.exports = UtilsLinux;
