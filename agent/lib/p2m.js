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
    Q = require('q'),
    u = require('util'),
    utils = new (require('./utils'))();

Q.longStackSupport = true;

/**
 * P2M DSL - inherited by all DSL based modules.
 * @constructor
 */
var P2M = function () {
  //this.classname = 'P2M';
  var self = this;
  self._name = 'MISSING NAME';
  self._actionFn = function () {};
};

/*
P2M.prototype.getClassName = function () {
  return this.classname;
};
*/

/*
 * Wrap methods
 * ============
 * called from P2.
 */

/**
 * Called from p2, return module name to module importer
 * @private
 * @returns {string} module name
 */
P2M.prototype.getName = function() {
  var self = this;
  if (!self._name) {
    throw new Error('module name not specified');
  }
  return self._name;
};

P2M.prototype.getActionFn = function () {
  var self = this;
  return self._actionFn;
};

/*
P2M.prototype.addStep = function () {
  var self = this;

  if (self._addStep) {

  }
};
*/

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
  self._name = name;
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


P2M.prototype.action = function (fn) {
  var self = this;
  self._actionFn = fn;

  /**
   * Called from p2, add an action step
   * @param {object}   _impl p2 dsl object
   * @param {string}   title title
   * @param {object}   opts  options
   * @param {function} cb    callback to DSL
   */
  self.addStep = function (_impl, title, opts, cb) {

    if (!opts) {
      opts = {};
    }

    if (typeof (opts) === 'function') {
      cb = opts;
      opts = {};
    }
    utils.dlog('p2m addStep opts: %s', u.inspect(opts, {colors: true, depth: 2}));

    if (_impl.ifNode()) {
      _impl.push_action(function (nextStepCb, inWatchFlag) {
        var deferred = Q.defer();

        utils.dlog('p2m addStep calling fn (action) title: %s opts: %s', title, u.inspect(opts, {colors: true, depth: 2}));
        fn({
          deferred: deferred,
          inWatchFlag: inWatchFlag,
          _impl: _impl,
          title: title,
          opts: opts,
          cb: cb
        });

        deferred.promise
        .fail(function (err) {
          console.error(u.format('error: module %s err: %s', self.name, err));
        })
        .then(function (o) {
          utils.dlog('p2m addStep() action resolved with: %s', u.inspect(o, {colors: true, depth: 2}));
          utils.callbackEvent(nextStepCb, _impl.facts, o); // move to next policy directive in p2
        })
        .done();
      });
    }

  };

  return self;
};



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


P2M.Module = function (deffn) {
  var M = function () {
    M.super_.call(this);

    deffn.apply(this);
    //console.log('P2M.Module this:', u.inspect(this, {colors: true, depth:3}));
  };

  u.inherits(M, P2M);

  return M;
};


module.exports = P2M;
