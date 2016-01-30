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

var Package = function () {
  var self = this;
};

u.inherits(Package, Provider);

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

Package.getName = function () { return 'package'; };
Package.prototype.getFacts = function (facts) {
  var self = this;
  self._getDefaultProvider(facts);
  return self._getFacts(module.filename, facts);
};

module.exports = Package;
