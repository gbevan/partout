/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2017 Graham Lee Bevan <graham.bevan@ntlworld.com>

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
    _ = require('lodash'),
    NetDep = require('./netdep');

var Capture = function () {
  this.plugins = {
    netDep: new NetDep()
  };
};

Capture.prototype.start = function () {
  _.each(this.plugins, function (plugin, k) {
    console.info('Starting capture plugin:', k);
    plugin.start();
  });
};

Capture.prototype.get = function () {
  var plugin_results = {};

  _.each(this.plugins, function (plugin, k) {
    plugin_results[k] = plugin.get();
  });

  return plugin_results;
};

module.exports = Capture;
