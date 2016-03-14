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
    u = require('util'),
    os = require('os'),
    fs = require('fs'),
    cfg = new (require('../../../etc/partout_agent.conf.js'))(),
    path = require('path'),
    _ = require('lodash');

/**
 * @module Facts
 *
 * @description Facts gathering module
 */
var Facts = function () {
  var self = this;  // self is p2 _impl DSL ????
  return self;    // ????
};

u.inherits(Facts, Provider);

/**
 * Get module name
 * @returns {string} Name of module
 */
Facts.getName = function () { return 'Facts'; };

/**
 * Calls _getFacts() in heritied from Provider.
 * @param   {object} facts Facts so far
 * @returns {object} Promise for facts
 */
Facts.prototype.getFacts = function (facts) {
  var self = this;
  //console.log('Facts self:', self, '_getFacts:', self._getFacts);

  var UUIDFile = path.join(cfg.PARTOUT_VARDIR, 'UUID');

  var myFacts = {
    /*****************************************************************
     * Gather generic, node available, facts about this agent system
     */
    partout_agent_uuid: (fs.existsSync(UUIDFile) ? fs.readFileSync(UUIDFile).toString() : ''),
    partout_agent_facts_module_dirname: __dirname,
    partout_agent_cwd: process.cwd(),
    partout_agent_memusage: process.memoryUsage(),
    partout_agent_uptime: process.uptime(),

    platform: process.platform,
    arch: process.arch,

    gid: (process.getgid ? process.getgid() : undefined),
    uid: (process.getuid ? process.getuid() : undefined),
    egid: (process.getegid ? process.getegid() : undefined),
    euid: (process.geteuid ? process.geteuid() : undefined),

    umask: '0' + process.umask().toString(8),

    node_version: process.version,
    node_versions: process.versions,

    os_type: os.type(),
    os_family: (os.type() === 'Windows_NT' ? 'windows' : 'unknown'), // provider will populate later
    os_arch: os.arch(),
    os_release: os.release(),
    os_uptime: os.uptime(),
    os_loadavg: os.loadavg(),
    os_totalmem_bytes: os.totalmem(),
    os_freemem_bytes: os.freemem(),
    os_cpus: os.cpus(),
    os_numcpus: os.cpus().length,
    os_nics: os.networkInterfaces(),
    os_endianness: os.endianness(),
    os_hostname: os.hostname(),
  };

  _.merge(facts, myFacts);

  return self._getFacts(module.filename, facts);
};

module.exports = Facts;
