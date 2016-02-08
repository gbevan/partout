/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

var Provider = require('../../provider'),
    console = require('better-console'),
    u = require('util');

/**
 * @module Facts
 *
 * @description Facts gathering module
 */
var Facts = function () {
  var self = this;  // self is p2 _impl DSL ????
  return self;    // ????
};

u.inherits(Facts, Provider);

/**
 * Get module name
 * @returns {string} Name of module
 */
Facts.getName = function () { return 'Facts'; };

/**
 * Calls _getFacts() in heritied from Provider.
 * @param   {object} facts Facts so far
 * @returns {object} Promise for facts
 */
Facts.prototype.getFacts = function (facts) {
  var self = this;
  //console.log('Facts self:', self, '_getFacts:', self._getFacts);
  return self._getFacts(module.filename, facts);
};

module.exports = Facts;
