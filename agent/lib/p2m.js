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

/*jslint node: true, nomen: true */
'use strict';

var console = require('better-console'),
    Q = require('q');

/**
 * P2M DSL - inherited by all DSL based modules.
 * @constructor
 */
var P2M = function () {

};

/*
 * Wrap methods
 * ============
 */

/**
 * Return module name to module importer
 * @returns {string} module name
 * @private
 */
P2M.prototype.getName = function() {
  var self = this;
  return self.name;
};



/*
 * DSL Commands
 * ============
 */

/**
 * P2M DSL: provide this module's name
 * @param   {string} name Module name
 * @returns {object} DSL chain
 */
P2M.prototype.name = function (name) {
  var self = this;
  console.log('P2M name:', name);

  self.name = name;

  return self;
};

/**
 * P2M DSL: alias of name().
 * @name module_name
 * @memberof P2M
 * @function
 * @instance
 */
P2M.prototype.module_name = P2M.prototype.name;

/**
 * P2M DSL: provide function to gather facts for this module
 * @param   {function} fn Fact gathering function(deferred, facts_so_far) {... deferred.resolve(facts);}
 * @returns {object}   deferred promise of facts
 */
P2M.prototype.facts = function (fn) {
  var self = this;

  self.getFacts = function (facts_so_far) {
    var deferred = Q.defer();

    fn(deferred, facts_so_far);

    return deferred.promise;
  };

  return self;
};

module.exports = P2M;
