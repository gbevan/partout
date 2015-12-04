/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

var _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  exec = require('child_process').exec;

/**
 * @constructor
 * @description
 * Facts module
 * ============
 *
 * built-in module for gathering core facts.
 */

var Facts = function (cb) {
  var self = this;  // self is parents _impl

  return self;
};

/**
 * Return this module's name
 * @return {String} name of module
 */
Facts.getName = function () { return 'Facts'; };

/**
 * Return this module's discovered facts
 * @return {String} name of module
 */
Facts.getFacts = function () {
  var facts = {

    /***************************************
     * Gather facts about this agent system
     */

    platform: process.platform,
    arch: process.arch,

    node_version: process.version,
    node_versions: process.versions,

    os_type: os.type(),
    os_arch: os.arch(),
    os_release: os.release(),
    os_uptime: os.uptime(),
    os_loadavg: os.loadavg(),
    os_totalmem_bytes: os.totalmem(),
    os_freemem_bytes: os.freemem(),
    os_cpus: os.cpus(),
    os_numcpus: os.cpus().length,
    os_nics: os.networkInterfaces()
  };
  console.log('facts:', facts);
  return facts;
};

module.exports = Facts;
