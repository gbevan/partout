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

var console = require('better-console'),
  _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  exec = require('child_process').exec,
  Q = require('q'),
  utils = new(require('../../utils'))();

Q.longStackSupport = true;

var Service = function () {

};

Service.runAction = function (_impl, next_step_callback, title, opts, command_complete_cb) {
  var self = this;  // self is _impl

  console.warn('IN RUNACTION');

  next_step_callback(); // when finished
};

Service.getFacts = function (facts_so_far) {
  var self = this,
      facts = {},
      services = {},
      deferred = Q.defer(),
      cmd = '';

  utils.execToArray('initctl list')
  .then(function (res) {
    var upstart_lines = res.outlines;
    _.forEach(upstart_lines, function (up_line) {
      var up_m = up_line.match(/^(.*)\s+(stop|start)\/(waiting|starting|pre-start|spawned|post-start|running|pre-stop|stopping|killed|post-stop)/);
      if (up_m) {
        var up_name = up_m[1],
          up_desired = up_m[2],
          up_status = up_m[3];
        services[up_name] = {
          desired: up_desired,
          actual: up_status,
          provider: 'upstart'
        };
      }
    });

    utils.execToArray('service --status-all 2>&1')
    .then(function (res) {
      var sysv_lines = res.outlines;

      // get Runlevel
      utils.execToArray('/sbin/runlevel')
      .then(function (res) {
        //console.log('res:', res);
        var lines = res.outlines
        var line = lines[0],
          flds = line.split(/\s+/),
          runlevel = flds[1];

        // get list of file links in /etc/rc?.d/
        var sysv_deferred = Q.defer();
        if (res.rc === 0) {
          Q.nfcall(fs.readdir, '/etc/rc' + runlevel + '.d/')
          .then(function (files) {
            var file_hash = {};

            files.forEach(function (e) {
              var me = e.match(/^S\d+(.*)/);
              if (me) {
                file_hash[me[1]] = true;
              }
            });
            sysv_deferred.resolve(file_hash);
          })
          .done();
        } else {
          sysv_deferred.resolve();
        }
        sysv_deferred.promise
        .then(function (file_hash) {
          _.forEach(sysv_lines, function (sysv_line) {
            var sysv_m = sysv_line.match(/^\s*\[\s*(\+|\-|\?)\s*\]\s*(.*)/);
            if (sysv_m) {
              var sysv_name = sysv_m[2],
                sysv_status = sysv_m[1];
              sysv_status = (sysv_status === '+' ? 'running' : (sysv_status === '-' ? 'stopped' : 'unknown'));
              if (!services[sysv_name]) {
                /*
                 * determine desired status from runlevel and sysv startscript
                 */
                services[sysv_name] = {
                  desired: (!file_hash ? 'unknown' : (file_hash[sysv_name] ? 'start' : 'stop')),
                  actual: sysv_status,
                  provider: 'sysv'
                };
              }
            }
          });
          facts.services = services;
          deferred.resolve(facts);
        });
      });
    })
    .done();
  })
  .done();

  return deferred.promise;
};


module.exports = Service;
