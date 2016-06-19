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

/*global p2*/
var console = require('better-console'),
    Provider = require('./provider'),
    Q = require('q'),
    u = require('util'),
    utils = new (require('./utils'))(),
    _ = require('lodash'),
    heredoc = require('heredoc');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/**
 * P2M DSL - inherited by all DSL based modules.
 * @constructor
 */
var P2M = function () {
  //this.classname = 'P2M';
  var self = this;
  self._name = '__MISSING NAME__';
  self._actionFn = function () {};
};

u.inherits(P2M, Provider);

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


P2M.prototype.action = function (fn, action_args) {
  var self = this;
  self._actionFn = fn;

  if (!action_args) {
    action_args = {
      immediate: false
    };
  }

  if (action_args.immediate) {
    self.runAction = function (_impl, next_step_callback, inWatchFlag, title, opts, cb) {
      //utils.dlog('P2M in runAction() arguments:', arguments);

      var deferred = Q.defer();

      utils.dlog('p2m runAction (immediate) calling fn (action) title: %s opts: %s', title, u.inspect(opts, {colors: true, depth: 2}));

      fn.call(self, {
        deferred: deferred,
        inWatchFlag: inWatchFlag,
        _impl: _impl,
        title: title,
        opts: opts,
        cb: cb
      });

      return deferred.promise
      .done(next_step_callback, function (err) {
        console.error(heredoc(function () {/*
********************************************************
*** P2M (action) Caught Error:
        */}), err);

        console.log('Stack:', (new Error()).stack);
      });

      //return _impl;

    };
    return self;
  }

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

    if (opts.provider) {
      self.provider = opts.provider;
    }

    utils.dlog('p2m addStep opts: %s', u.inspect(opts, {colors: true, depth: 2}));

    if (_impl.ifNode()) {

      if (opts.on) {
        self.on(opts.on);
      }

      _impl.push_action(function (nextStepCb, inWatchFlag) {
        var deferred = Q.defer(),
            ev_prefix = u.format('%s:%s', self._name, title);

        utils.dlog('p2m addStep calling fn (action) title: %s opts: %s', title, u.inspect(opts, {colors: true, depth: 2}));

        fn.call(self, {
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
          _impl.emitter.emit(u.format('%s:%s', ev_prefix, 'fatal'), err);
        })
        .then(function (o) {

          var nextStepFn = function (o, dontCallCb) {
            if (o && o.result) {
              var evname = u.format('%s:%s', ev_prefix, o.result);

              console.log(u.format(
                'p2m: %s title: %s - nextStepFn() deferred resolved to o: %s, emitting: %s',
                self._name,
                title,
                u.inspect(o, {colors: true, depth: 2}),
                evname
              ));
              //console.log('STACK:\n', (new Error()).stack);

              var hadListeners = _impl.emitter.emit(evname, {
                eventname: evname,
                module: self._name,
                title: title,
                opts: opts
              });

              if (!hadListeners) {
                console.warn(u.format('p2m: event %s had no listeners', evname));
              }
            }
            if (!dontCallCb) {
              nextStepCb(o);
            }
          };

          nextStepFn(o, true);

          utils.dlog('calling provider _runAction()');
          self._runAction(_impl, nextStepFn, inWatchFlag, title, opts, cb);
        })
        .done(null, function (err) {
          console.error(heredoc(function () {/*
********************************************************
*** P2M addStep Caught Error:
          */}), err);

          console.log('Stack:', (new Error()).stack);
        });
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
    var fn_deferred = Q.defer(),
        getF_deferred = Q.defer(),
        facts = {};

    _.merge(facts, facts_so_far);

    fn.call(self, fn_deferred, facts_so_far);

    fn_deferred.promise
    .done(function (index_facts) {
      _.merge(facts, index_facts);
      utils.dlog('P2M: facts()  moduleFileName:', self.moduleFileName);
      //utils.dlog('P2M: facts() facts:', facts);
      //getF_deferred.resolve(self._getFacts(self.moduleFileName, facts)); // <<<<< module.filename is p2m should be module!!!
      self._getFacts(facts)
      .done(function (prov_facts) {
        _.merge(facts, prov_facts);
        getF_deferred.resolve(facts);
      });
    });

    return getF_deferred.promise;
  };

  return self;
};

/**
 * Create a listener to fire events
 * @param {object} evdefs Event handler defs {'module:title:result': 'action' | function () {} | [ ], ...}
 */
P2M.prototype.on = function (evdefs) {
  var self = this;

  _.each(evdefs, function (h, k) {
    console.log('Adding listener for:', k);

    if (typeof(h) === 'function') {

      p2.emitter.on(k, function () {
        p2.pushSteps();
        h.apply(this, arguments);
        p2.flattenSteps();
      });

    } else {
      throw 'Unsupported on event handler type: ' + typeof(h);
    }
  });

};


P2M.Module = function (moduleFileName, deffn) {
  utils.dlog('====================================');
  utils.dlog('P2M.Module.moduleFileName:', moduleFileName);

  var M = function () {
    var self = this;

    M.super_.call(self);
    self.moduleFileName = moduleFileName;
    utils.dlog('P2M.Module M.moduleFileName:', self.moduleFileName);

    deffn.apply(self);
    //console.log('P2M.Module this:', u.inspect(this, {colors: true, depth:3}));
  };

  u.inherits(M, P2M);

  return M;
};


module.exports = P2M;
