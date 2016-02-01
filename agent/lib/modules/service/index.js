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
 * Service module
 * ==============
 *
 *  p2.service(
 *    'title',
 *    options,
 *    function (err) {
 *      ... to be called after applying any action ...
 *    }
 *  )
 *
 * Options:
 *   | Operand    | Type    | Description                                                |
 *   |:-----------|---------|:-----------------------------------------------------------|
 *   | name       | String  | Name of the service to manage (defaults to title) |
 *   | ensure     | String  | stopped, running (defaults to stopped) |
 *   | enable     | Boolean | true, false |
 *   | provider   | String  | Override backend provider e.g.: debian, redhat, etc |
 */

var Service = function () {
  var self = this;
};

u.inherits(Service, Provider);

Service.prototype._getDefaultProvider = function (facts, opts) {
  var self = this;

  if (!opts) {
    opts = {};
  }

  // Choose default providers (if not manually provided in policy)
  if (!opts.provider) {
    if (facts.os_family === 'debian') {
      opts.provider = 'debian';

    } else if (facts.os_family === 'redhat') {
      opts.provider = 'redhat';
    }
  }
  self.provider = opts.provider;
};

Service.prototype.addStep = function (_impl, title, opts, command_complete_cb) {
  var self = this;  // self is p2 _impl DSL

  if (typeof (opts) === 'function') {
    command_complete_cb = opts;
    opts = {};
  }

  if (!opts) {
    opts = {};
  }
  opts.name = (opts.name ? opts.name : title);
  opts.ensure = (opts.ensure ? opts.ensure : 'stopped');
  opts.enable = (opts.ensure === undefined ? opts.ensure : false);

  self._getDefaultProvider(_impl.facts, opts);

  //console.warn('service b4 ifNode');
  if (!_impl.ifNode()) {
    return self;
  }
  //console.warn('service after ifNode passed');

  _impl.push_action(function (next_step_callback) {
    //var self = this;
    self.runAction(_impl, module.filename, next_step_callback, [title, opts, command_complete_cb]);

  }); // push action

  //return self;
};

Service.getName = function () { return 'service'; };
Service.prototype.getFacts = function (facts) {
  var self = this;
  return self._getFacts(module.filename, facts);
};

module.exports = Service;
