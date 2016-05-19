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

var /*Provider = require('../../provider'),*/
    console = require('better-console'),
    u = require('util'),
    utils = new (require('../../utils.js'))(),
    P2M = require('../../p2m'),
    npm = new (require('./npm'))(),
    Q = require('q');

// Q.longStackSupport = true;

/**
 * @module Package
 *
 * @description
 * Package module
 * ==============
 *
 * Manage System Packages
 *
 *     p2.package(
 *       'title or pkg name',
 *       options,
 *       function (err, stdout, stderr) {
 *         ... to be called after exec of pkg command ...
 *       }
 *     )
 *
 * Options:
 *
 *   | Operand    | Type    | Description                                                |
 *   |:-----------|---------|:-----------------------------------------------------------|
 *   | name       | String  | Package name to install (defaults to title) |
 *   | ensure     | String  | present/installed, absent/purged, latest (default is present) |
 *   | provider   | String  | Override backend provider e.g.: apt, yum, rpm, etc |
 *
 */

var Package = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('package')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {

    // get npm pkgs
    npm.getFacts(facts_so_far)
    .done(function (facts) {
//      if (!facts) {
//        facts = {};
//      }

      facts.p2module = {
        package: {
          loaded: true
        }
      };
      //console.log('package facts:', facts);
      deferred.resolve(facts);
    });
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
    utils.dlog('Package index: in action ############################');

    // defaults
    if (!opts.name) {
      opts.name = title;
    }
    if (!opts.ensure) {
      opts.ensure = 'latest';
    }

    deferred.resolve();
  });

});

Package.prototype.setProvider = function (facts) {
  var self = this;
  utils.dlog('Package setProvider() self:', self);
  utils.dlog('Package setProvider() self.provider:', self.provider);
  if (facts.os_family === 'debian') {
    return 'apt';

  } else if (facts.os_family === 'redhat') {
    return 'yum';

  } else if (facts.os_family === 'suse') {
    return 'zypp';

  } else if (facts.os_family === 'windows') {
    return 'winfeature';
  }

  return null;
};


module.exports = Package;
