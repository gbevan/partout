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

var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    Q = require('q'),
    utils = new (require('../../utils'))(),
    u = require('util'),
    pfs = new (require('../../pfs'))(),
    stringArgv = require('string-argv');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

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

    var deferred = args.deferred,
        inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '',
        name = title;

    if (opts.p2) {

      if (_impl[name]) {
        console.error(u.format('ERROR: Cannot add new role, name "%s" already exists'), name);
        deferred.resolv();
        return;
      }
      _impl[name] = function (mod_title, mod_opts) {

        /*
         * add passed p2 args dsl to addSteps in the p2 _impl
         */
        opts.p2(mod_title, mod_opts);

        /*
         * as this called from chained _impl dsl directives
         * we must return _impl to continue the dsl chaining
         */
        return _impl;
      };
    }

    deferred.resolve();

  }, {immediate: true}) // action

  .action(function (args) {
    var deferred = args.deferred;

    deferred.resolve();
  })
  ;

});

module.exports = Role;
