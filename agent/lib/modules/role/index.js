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
var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    Q = require('q'),
    utils = require('../../utils'),
    u = require('util'),
    pfs = require('../../pfs'),
    stringArgv = require('string-argv'),
    heredoc = require('heredoc');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/**
 * @module Role
 *
 * @description
 * Role module
 * ===========
 *
 *     p2
 *     .role('new_role_name', {
 *
 *       facts: function (deferred, facts_so_far, title, opts) {
 *         ...
 *         deferred.resolve();
 *       },
 *
 *       p2: function (title, opts) {
 *         ...
 *         return value | deferred.promise
 *       }
 *
 *     });
 *
 * Defines a Role (custom module), that can be used later as a p2 DSL command.
 *
 */
var Role = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */
  self

  ////////////////////
  // Name this module
  .name('role')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        Role: {
          loaded: true
        }
      },
      p2role: {}
    };

    deferred.resolve(facts);
  })

  //////////////////
  // Action handler
  .action(function (args) {

    //console.log('role in action args:', args);

    var deferred = args.deferred,
        inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '',
        name = title;


    if (_impl[name]) {
      console.error(u.format('ERROR: Cannot add new role, name "%s" already exists'), name);
      deferred.resolv();
      return;
    }

    if (utils.isVerbose()) {
      console.info('Creating module ' + name + ' from role');
    }
    _impl[name] = function (mod_title, mod_opts) {
      //console.log('in role instance:', name);

      /*
       * push role's facts gatherer function onto p2 steps
       */
      function push_refreshFacts () {
        //console.log('role:', name, 'refreshFacts() from:', (new Error()).stack);
        if (opts.facts) {
          //console.log('role:', name, 'refreshFacts() push_action');
          _impl.push_action(function () {
            //console.log('role:', name, 'refreshFacts() in pushed action');
            var facts_deferred = Q.defer();

            opts.facts(facts_deferred, _impl.facts, mod_title, mod_opts);

            return facts_deferred
            .promise
            .then(function (role_facts) {
              //console.log(name, 'role_facts:', role_facts);
              _.merge(_impl.facts.p2role, role_facts.p2role);
              _.each(role_facts, function (v, k) {
                if (!k.match(/^(p2role)$/)) {
                  _impl.facts[k] = v;
                }
              });
              return 'Role: refreshFacts complete';
            });
          });
        }
      }

      if (_impl.ifNode()) {
//
//        /*
//         * push role's facts gatherer function onto p2 steps
//         */
//        if (opts.facts) {
//          _impl.push_action(function (cb) {
//            var facts_deferred = Q.defer();
//
//            opts.facts(facts_deferred, _impl.facts, mod_title, mod_opts);
//
//            facts_deferred
//            .promise
//            .done(function (role_facts) {
//              _.merge(_impl.facts, role_facts);
//              cb();
//            });
//          });
//        }

        //push_refreshFacts();

        if (opts.p2) {
          /*
           * add passed p2 args dsl to addSteps in the p2 _impl
           */
          push_refreshFacts();
          // defer pushing on to actions so facts run first
          _impl.push_action(function () {
            utils.vlog(u.format('Role: %s running action: %s', name, mod_title));


            p2.pushSteps(); // save steps state

            var deferred = Q.defer();

            utils.dlog('role: action: calling p2:', opts.p2);
            var role_promise = opts.p2(
              mod_title,
              (mod_opts ? mod_opts : {})
            ); // pushes it's own actions to run next

            if (!Q.isPromise(role_promise)) {
              role_promise = Q();
            }
            role_promise
            .done(function (role_res) {
              utils.dlog('role_promise resolved - role_res:', role_res);
              //p2.pushSteps(); // save steps state
              push_refreshFacts();
              p2.flattenSteps(); // pop previous steps state after new steps

              deferred.resolve();

            }, function (err) {
              console.error(heredoc(function () {/*
********************************************************
*** Role Module Caught Error:
              */}), err);
              deferred.reject(err);
            });

            return deferred.promise;
        });
        }

      } // ifNode

      /*
       * as this called from chained _impl dsl directives
       * we must return _impl to continue the dsl chaining
       */
      return _impl;
    };

    deferred.resolve();


  }, {immediate: true}) // action

  .action(function (args) {
    var deferred = args.deferred;

    deferred.resolve();
  })
  ;

});

module.exports = Role;
