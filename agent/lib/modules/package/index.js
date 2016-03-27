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
    P2M = require('../../p2m');

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
    var facts = {
      p2module: {
        package: {
          loaded: true
        }
      }
    };
    self._getDefaultProvider(facts_so_far);
    deferred.resolve(facts);
  })

  .action(function (args) {
    var deferred = args.deferred,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '';
    utils.dlog('Package index: in action ############################');

    if (!opts.name) {
      opts.name = title;
    }

    self._getDefaultProvider(_impl.facts);

    deferred.resolve();
  });

});

Package.prototype.setProvider = function (facts) {
  if (facts.os_family === 'debian') {
    return 'apt';

  } else if (facts.os_family === 'redhat') {
    return 'yum';
  }

  return null;
};

Package.prototype._getDefaultProvider = function (facts, opts) {
  var self = this;

  if (!opts) {
    opts = {};
  }

  // Choose default providers (if not manually provided in policy)
  if (!opts.provider) {
    if (facts.os_family === 'debian') {
      opts.provider = 'apt';

    } else if (facts.os_family === 'redhat') {
      opts.provider = 'yum';
    }
  }
  self.provider = opts.provider;
};



/*
Package.prototype.addStep = function (_impl, title, opts, command_complete_cb) {
  //console.log('package addStep arguments:', arguments);
  var self = this;

  if (typeof (opts) === 'function') {
    command_complete_cb = opts;
    opts = {};
  }

  if (!opts) {
    opts = {};
  }
  opts.ensure = (opts.ensure ? opts.ensure : 'present');
  opts.name = (opts.name ? opts.name : title);

  if (!utils.vetOps('Package', opts, {
    name: true,
    ensure: true
  }) ) {
    return self;
  }

  self._getDefaultProvider(_impl.facts, opts);

  //console.warn('package b4 ifNode');
  if (!_impl.ifNode()) {
    return self;
  }
  //console.warn('package after ifNode passed');

  _impl.push_action(function (next_step_callback) {
    //var self = this;
    //console.warn('package index.js b4 runAction.call');
    self.runAction(_impl, module.filename, next_step_callback, [title, opts, command_complete_cb]);

  }); // push action

  //return self;
};

//Package.getName = function () { return 'package'; };
Package.prototype.getFacts = function (facts) {
  var self = this;
  self._getDefaultProvider(facts);
  return self._getFacts(module.filename, facts);
};
*/

module.exports = Package;
