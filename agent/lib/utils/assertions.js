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
    os = require('os'),
    Q = require('q'),
    u = require('util');

/**
 * Assertions utils
 *
 * @mixin
 */
var UtilsAssertions = function () {

};

/**
 * Test if current node version is at a minimum version
 * @param   {number}  ver Major Node version to test as minimum
 * @returns {boolean} true/false
 */
UtilsAssertions.prototype.minNodeVersion = function (ver) {
  var maj = (process.versions.node.split(/\./))[0] * 1;

  return (maj >= ver);
};

UtilsAssertions.prototype.isWin = function () {
  return process.platform === 'win32';
};

UtilsAssertions.prototype.isLinux = function () {
  return process.platform === 'linux';
};

UtilsAssertions.prototype.isVerbose = function () {
  return global.partout.opts.verbose;
};

UtilsAssertions.prototype.isDebug = function () {
  return global.partout.opts.debug;
};

UtilsAssertions.prototype.pIsAdmin = function () {
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

module.exports = UtilsAssertions;
