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
    Q = require('q'),
    u = require('util');

/**
 * Assertions utils
 *
 * @mixin
 */
var UtilsWindows = function () {

};

/**
 * Get Powershell version
 * @returns {object} Object returned from $PSVersionTable e.g.: {PSVersion: {Major: 5, ...}, ...}
 */
UtilsWindows.prototype.getPsVersion = function () {
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




module.exports = UtilsWindows;
