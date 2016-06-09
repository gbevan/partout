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

var /*Provider = require('../../provider'),*/
    console = require('better-console'),
    u = require('util'),
    utils = new (require('../../utils.js'))(),
    P2M = require('../../p2m');

// Q.longStackSupport = true;

/**
 * @module Service
 *
 * @description
 * Service module
 * ==============
 *
 * Manage System Services
 *
 *     p2.service(
 *       'title',
 *       options,
 *       function (err) {
 *          ... to be called after applying any action ...
 *       }
 *     )
 *
 * Options:
 *
 *   | Operand    | Type    | Description                                                |
 *   |:-----------|---------|:-----------------------------------------------------------|
 *   | name       | String  | Name of the service to manage (defaults to title) |
 *   | ensure     | String  | stopped, running (defaults to stopped) |
 *   | enable     | Boolean | true, false |
 *   | provider   | String  | Override backend provider e.g.: debian, redhat, etc |
 */

var Service = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('service')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        service: {
          loaded: true
        }
      }
    };
    //self._getDefaultProvider(facts_so_far);
    deferred.resolve(facts);
  })

  ////////////////
  // Action
  .action(function (args) {
    var deferred = args.deferred,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '';
    utils.dlog('Service index: in action ############################');

    opts.name = (opts.name ? opts.name : title);
    //opts.ensure = (opts.ensure ? opts.ensure : 'stopped');
    //opts.enabled = (opts.enabled !== undefined ? opts.enabled : (opts.ensure === 'running' ? true : false));

    if (!utils.vetOps('Service', opts, {
      name: true,
      ensure: true,
      enabled: true,

      exec: true,
      appdir: true,
      application: true,
      appparams: true,

      srvuser: true,
      dependson: true,
      description: true,
      displayname: true,
      startuptype: true
    }) ) {
      deferred.reject(new Error('Invalid argument(s)'));
      return;
    }

    deferred.resolve();
  });

});

module.exports = Service;
