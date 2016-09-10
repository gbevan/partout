/*jshint newcap: false*/
/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

var P2M = require('../../p2m'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Q = require('q'),
    cfg = new (require('../../../etc/partout_agent.conf.js'))(),
    path = require('path'),
    pickle = require('pickle'),
    utils = require('../../utils'),
    pfs = require('../../pfs'),
    u = require('util');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

var Facts = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  //.name('Facts')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var outer_deferred = deferred;

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
            deferred.resolve([factname, data.toString().trim()]);
          })
          .fail(function (err) {
            //console.log('err:', err);
            if (err.code !== 'EACCES') {
              console.error('reading file', filename, 'failed:', err.message);
            }
            deferred.resolve([factname, null]);
          })
          .done();
        } else {
          deferred.resolve([factname, null]);
        }
      });
      return deferred.promise;
    }

    /**
     * Get cpu data parsed from /proc/cpuinfo
     * @returns {Promise} resolves to ['cpuinfo': {...}]
     */
    function getCpuInfo() {
      var deferred = Q.defer(),
          cpuinfoFile = '/proc/cpuinfo',
          cpu_facts = {},
          re = /^([^:\t]*)\s+:\s+(.*)$/,
          reFlags = /vmx|svm/;

      cpu_facts.hw_accel_enabled = false;

      pfs.pExists(cpuinfoFile)
      .done(function (exists) {
        if (!exists) {
          deferred.resolve(['cpuinfo'], null);
          return;
        }

        pfs.pReadFile(cpuinfoFile)
        .done(function (buf) {
          var cpuinfo_str = buf.toString(),
              lines = utils.splitLines(cpuinfo_str),
              processor;

          lines.forEach(function (line) {
            var m = line.match(re);

            if (m) {
              var label = m[1],
                  value = m[2].trim();

              if (label === 'processor') {
                processor = value;
              }
              if (cpu_facts[processor] === undefined) {
                cpu_facts[processor] = {};
              }

              if (processor !== undefined) {
                cpu_facts[processor][label] = value;
              }

              if (label === 'flags' && value.search(reFlags)) {
                cpu_facts.hw_accel_enabled = true;
              }
            }

          });

          deferred.resolve(['cpuinfo', cpu_facts]);
        });
      });

      return deferred.promise;
    }

    var UUIDFile = path.join(cfg.PARTOUT_VARDIR, 'UUID');

    var facts = {};

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

    // get /proc/cpuinfo
    promises.push(getCpuInfo());

    /*
     * if cloud-init has an obj.pkl - load it as facts
     */
    var objpkl = '/var/lib/cloud/instance/obj.pkl',
        cloud_deferred = Q.defer();
    pfs.pExists(objpkl)
    .then(function (exists) {
      utils.dlog('facts linux: ', objpkl, 'exists:', exists);
      if (!exists) {
        cloud_deferred.resolve();
      } else {
        var objpklCmd = u.format('/usr/bin/python -c "import json; import pickle; F=open(\'%s\'); O=pickle.load(F); print json.dumps(O.ec2_metadata)"', objpkl);
        utils.pExec(objpklCmd)
        .fail(function (err) {
          utils.vlog('Warning: extract of ec2_metadata from cloud-init failed:', err);
          cloud_deferred.resolve(["ec2_metadata", {}]);
        })
        .then(function (jsonStr) {
          utils.dlog('ec2_metadata jsonStr:', jsonStr[0]);
          var cloudObj = JSON.parse(jsonStr[0]);
          utils.dlog('ec2_metadata cloudObj:', cloudObj);
          cloud_deferred.resolve(["ec2_metadata", cloudObj]);
        });
      }
    });
    promises.push(cloud_deferred.promise);

    /*
     * Determine details of Linux operating system from /etc/os-release
     * add to array of promises
     */
    var os_deferred = Q.defer();
    fs.exists('/etc/os-release', function (exists) {
      if (!exists) {

        // see if an early redhat dirivative
        fs.exists('/etc/redhat-release', function (rh_exists) {
          if (rh_exists) {
            Q.nfcall(fs.readFile, '/etc/redhat-release')
            .then(function (data) {
              data = data.toString();
              var rh = data.match(/(\w+)[^0-9]*([0-9.]+).*/);
              if (rh) {
                var pretty_name = 'UNKNOWN';
                if (rh[1]) {
                  pretty_name = rh[1];

                  if (rh[2]) {
                    pretty_name += ' ' + rh[2];
                  }
                }
                var l_fact = ['os_dist_pretty_name', pretty_name];
                promises.push(Q(l_fact));
              }
              os_deferred.resolve();
            });
          } else {
            os_deferred.resolve();
          }
        });

      } else {
        Q.nfcall(fs.readFile, '/etc/os-release')
        .then(function (data) {
          data = data.toString();
          //console.log('data:', data);
          var lines = data.toString().split(/\r?\n/);

          _.forEach(lines, function (line) {
            line = line.trim();
            if (line && line !== '') {
              //console.log('line:', line);
              var parts = line.split('=');
              //console.log('parts:', parts);
              var l_fact = ['os_dist_' + parts[0].toLowerCase(), parts[1].replace(/["']*/g, '')];
              //console.log('l_fact:', l_fact);
              promises.push(Q(l_fact));
            }
          });

          os_deferred.resolve();
        })
        .done();
      }
    });

    os_deferred.promise
    .done(function () {
      facts.os_family = 'unknown';

      Q.all(promises)
      .done(function (ar) {
        _.forEach(ar, function (res) {
          if (res) {
            facts[res[0]] = res[1];

            if (res[0] === 'os_dist_id_like') {
              if (res[1].match(/(rhel|fedora)/i)) {
                facts.os_family = 'redhat';
              } else {
                facts.os_family = res[1];
              }
            }
          }
        });

        if (!facts.os_dist_name) {
          if (facts.os_dist_pretty_name) {
            facts.os_dist_name = (facts.os_dist_pretty_name.split(/\s+/))[0];
          }
        }

        if (facts.os_family === 'unknown' && facts.os_dist_name) {
          if (facts.os_dist_name.match(/(oracle|centos)/i)) {
            facts.os_family = 'redhat';
          } else {
            facts.os_family = facts.os_dist_name.toLowerCase();
          }
        }
        //console.log('facts:', facts);
        outer_deferred.resolve(facts);
      })
      //.done();
      ;
    })
    //.done();
    ;

    return outer_deferred.promise;
  })

  ;

});


module.exports = Facts;
