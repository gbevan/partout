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
    console = require('better-console');

var Package = function (title, opts, command_complete_cb) {
  var self = this;  // self is p2 _impl DSL

  if (typeof (opts) === 'function') {
    command_complete_cb = opts;
    opts = {};
  }

  if (!opts) {
    opts = {};
  }

  opts.ensure = (opts.ensure ? opts.ensure : 'present');
  opts.name = (opts.name ? opts.name : title);

  //console.warn('package b4 ifNode');
  if (!self.ifNode()) {
    return self;
  }
  //console.warn('package after ifNode passed');

  self.push_action(function (next_step_callback) {
    var self = this;  // self is _impl
    //console.log('package b4 runAction self:', self);
    //console.warn('package index.js b4 runAction.call');
    Provider.runAction.call(self, module.filename, next_step_callback, [title, opts, command_complete_cb]);

  }); // push action

  return self;
};

Package.getName = function () { return 'package'; };
Package.getFacts = function (facts) {
  var self = this;
  return Provider.getFacts.call(self, module.filename, facts);
};

module.exports = Package;
