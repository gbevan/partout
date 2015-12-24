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
  exec = require('child_process').exec,
  Q = require('q');

Q.longStackSupport = true;

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
  var outer_deferred = Q.defer();

  function tryRead(file) {
    var deferred = Q.defer(),
      factname = file[0],
      filename = file[1];

    //console.log('tryRead', factname, filename);
    fs.exists(filename, function (exists) {
      //console.log('exists:', exists);
      if (exists) {
        Q.nfcall(fs.readFile, filename)
        .then(function (data) {
          deferred.resolve([factname, data.toString()]);
        })
        .fail(function (err) {
          console.error('reading file', filename, 'failed:', err.message);
          deferred.resolve([factname, null]);
        })
        .done();
      } else {
        deferred.resolve([factname, null]);
      }
    });
    return deferred.promise;
  }

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

  };

  /*
   * try to read these files as facts
   * array, each entry is [ 'name of fact', 'filename to read' ]
   */
  var files = [],
    promises = [];

  if (os.type() === 'Linux') {
    files = [
      [ 'sys_bios_date',          '/sys/devices/virtual/dmi/id/bios_date'         ],
      [ 'sys_bios_vendor',        '/sys/devices/virtual/dmi/id/bios_vendor'       ],
      [ 'sys_board_asset_tag',    '/sys/devices/virtual/dmi/id/board_asset_tag'   ],
      [ 'sys_board_name',         '/sys/devices/virtual/dmi/id/board_name'        ],
      [ 'sys_board_serial',       '/sys/devices/virtual/dmi/id/board_serial'      ],
      [ 'sys_board_vendor',       '/sys/devices/virtual/dmi/id/board_vendor'      ],
      [ 'sys_board_version',      '/sys/devices/virtual/dmi/id/board_version'     ],
      [ 'sys_chassis_asset_tag',  '/sys/devices/virtual/dmi/id/chassis_asset_tag' ],
      [ 'sys_chassis_serial',     '/sys/devices/virtual/dmi/id/chassis_serial'    ],
      [ 'sys_chassis_type',       '/sys/devices/virtual/dmi/id/chassis_type'      ],
      [ 'sys_chassis_vendor',     '/sys/devices/virtual/dmi/id/chassis_vendor'    ],
      [ 'sys_chassis_version',    '/sys/devices/virtual/dmi/id/chassis_version'   ],
      [ 'sys_modalias',           '/sys/devices/virtual/dmi/id/modalias'          ],
      [ 'sys_product_name',       '/sys/devices/virtual/dmi/id/product_name'      ],
      [ 'sys_product_serial',     '/sys/devices/virtual/dmi/id/product_serial'    ],
      [ 'sys_product_uuid',       '/sys/devices/virtual/dmi/id/product_uuid'      ],
      [ 'sys_product_version',    '/sys/devices/virtual/dmi/id/product_version'   ],
    ];
  }

  _.forEach(files, function (file) {
    promises.push(tryRead(file));
  });
  //console.log('promises:', promises);

  Q.all(promises)
  .then(function (ar) {
    _.forEach(ar, function (res) {
      facts[res[0]] = res[1];
    });
    //console.log('facts:', facts);
    outer_deferred.resolve(facts);
  })
  .done();

  //console.log('facts:', facts);
  //return facts;
  return outer_deferred.promise;
};

module.exports = Facts;
