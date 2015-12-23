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

    partout_agent_uuid: (fs.existsSync('etc/UUID') ? fs.readFileSync('etc/UUID').toString() : ''),
    partout_agent_facts_module_dirname: __dirname,
    partout_agent_cwd: process.cwd(),
    partout_agent_memusage: process.memoryUsage(),

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
    os_nics: os.networkInterfaces(),
    os_endianness: os.endianness(),
    os_hostname: os.hostname(),

    bios_date: fs.readFileSync('/sys/devices/virtual/dmi/id/bios_date').toString().trim(),
    bios_vendor: fs.readFileSync('/sys/devices/virtual/dmi/id/bios_vendor').toString().trim(),
    board_asset_tag: fs.readFileSync('/sys/devices/virtual/dmi/id/board_asset_tag').toString().trim(),
    board_name: fs.readFileSync('/sys/devices/virtual/dmi/id/board_name').toString().trim(),
    //board_serial: fs.readFileSync('/sys/devices/virtual/dmi/id/board_serial').toString().trim(),
    board_vendor: fs.readFileSync('/sys/devices/virtual/dmi/id/board_vendor').toString().trim(),
    board_version: fs.readFileSync('/sys/devices/virtual/dmi/id/board_version').toString().trim(),
    chassis_asset_tag: fs.readFileSync('/sys/devices/virtual/dmi/id/chassis_asset_tag').toString().trim(),
    //chassis_serial: fs.readFileSync('/sys/devices/virtual/dmi/id/chassis_serial').toString().trim(),
    chassis_type: fs.readFileSync('/sys/devices/virtual/dmi/id/chassis_type').toString().trim(),
    chassis_vendor: fs.readFileSync('/sys/devices/virtual/dmi/id/chassis_vendor').toString().trim(),
    chassis_version: fs.readFileSync('/sys/devices/virtual/dmi/id/chassis_version').toString().trim(),
    modalias: fs.readFileSync('/sys/devices/virtual/dmi/id/modalias').toString().trim(),
    product_name: fs.readFileSync('/sys/devices/virtual/dmi/id/product_name').toString().trim(),
    //product_serial: fs.readFileSync('/sys/devices/virtual/dmi/id/product_serial').toString().trim(),
    //product_uuid: fs.readFileSync('/sys/devices/virtual/dmi/id/product_uuid').toString().trim(),
    product_version: fs.readFileSync('/sys/devices/virtual/dmi/id/product_version').toString().trim(),
  };


  console.log('facts:', facts);
  return facts;
};

module.exports = Facts;
