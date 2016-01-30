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
    utils = new(require('../../utils'))(),
    u = require('util');

Q.longStackSupport = true;

Q.onerror = function (err) {
  console.error(err);
};

/**
 * Debian provider for the Service module.
 *
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

};

Service.runAction = function (_impl, next_step_callback, title, opts, command_complete_cb) {
  var self = this;

  console.warn('IN RUNACTION');

  next_step_callback(); // when finished
};

// TODO: Plot path through quagmire of startup methods...

/**
 * Get Service Facts for Debian
 * @param   {Object} facts_so_far The Facts discovered so far by p2
 * @returns {Object} Promise for facts
 *
 * @abstract
 *
 * initctl list (upstart) -> services
 *   -> service --status-all (sysv) -> sysv_lines
 *     -> runlevel
 *       -> /etc/rc?.d/S??name -> file_hash
 */

/**
 * Get Service list and statuses from Upstart
 * @returns {Object} Services[name]={desired:..., actual:..., provider: "upstart"}
 */
Service._getUpstartList = function () {
  var services = {},
      deferred = Q.defer();

  utils.execToArray('initctl list')
  .then(function (res) {
    var upstart_lines = res.outlines;
    _.forEach(upstart_lines, function (up_line) {
      up_line = up_line.trim();
      if (up_line === '') {
        return;
      }
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
  })
  .done(function () {
    deferred.resolve(services);
  });
  return deferred.promise;
};

/**
 * Get the current sysv runlevel
 * @returns {Object} Promise -> runlevel
 */
Service._getRunLevel = function () {
  var deferred = Q.defer();

  utils.execToArray('/sbin/runlevel')
  .then(function (res) {
    //console.log('res:', res);
    var lines = res.outlines,
        line = lines[0],
        flds = line.split(/\s+/),
        runlevel = flds[1];
    deferred.resolve(runlevel);
  })
  .fail(function (err) {
    deferred.resolve(2);  // fall back to 2. hmmmm
  })
  .done();

  return deferred.promise;
};

/**
 * Get sysv services that are enabled for the current runlevel
 * @returns {Object} Promise -> {service: true, ...}
 */
Service._getSysvEnabled = function () {
  var self = this,
      deferred = Q.defer();

  self._getRunLevel()
  .then(function (runlevel) {
    // get list of file links in /etc/rc?.d/S??name for desired state
    Q.nfcall(fs.readdir, '/etc/rc' + runlevel + '.d/')
    .then(function (files) {
      var file_hash = {};

      files.forEach(function (e) {
        var me = e.match(/^S\d+(.*)/);
        if (me) {
          file_hash[me[1]] = true;
        }
      });
      deferred.resolve(file_hash);
    })
    .done();
  })
  .done();

  return deferred.promise;
};

/**
 * Get sysv service list and status
 * @returns {Object} Services[name]={desired:..., actual:..., provider: "upstart"}
 */
Service._getSysvList = function () {
  var self = this,
      deferred = Q.defer();

  self._getSysvEnabled()
  .then(function (sysv_enabled) {

    utils.execToArray('service --status-all 2>&1')
    .then(function (res) {
      var sysv_lines = res.outlines,
          inner_deferreds = [];

      _.forEach(sysv_lines, function (sysv_line) {
        var sysv_m = sysv_line.match(/^\s*\[\s*(\+|\-|\?)\s*\]\s*(.*)/);
        //console.log('service debian sysv_m:', sysv_m);
        if (sysv_m) {
          var sysv_name = sysv_m[2],
            sysv_status = sysv_m[1],
            sysv_desired = (!sysv_enabled ? 'unknown' : (sysv_enabled[sysv_name] ? 'start' : 'stop'));

          sysv_status = (sysv_status === '+' ? 'running' : (sysv_status === '-' ? 'stopped' : 'unknown'));
          var d = Q.defer();
          inner_deferreds.push(d.promise);

          if (sysv_status === 'unknown') {

            utils.execToArray('service ' + sysv_name + ' status')
            .then(function (res) {
              d.resolve({
                sysv_name: sysv_name,
                sysv_status: (res.rc === 0 ? 'running' : 'stopped'),
                sysv_desired: sysv_desired
              });
            })
            .fail(function (err) {
              d.resolve({
                sysv_name: sysv_name,
                sysv_status: 'unknown',
                sysv_desired: sysv_desired
              });
            })
            .done();
          } else {
            d.resolve({
              sysv_name: sysv_name,
              sysv_status: sysv_status,
              sysv_desired: sysv_desired
            });
          }

        }
      });
      Q.all(inner_deferreds)
      .done(function (statuses) {
        var services = {};

        statuses.forEach(function (s) {
          services[s.sysv_name] = {
            desired: s.sysv_desired,
            actual: s.sysv_status,
            provider: 'sysv'
          };
        });
        deferred.resolve(services);
      });

    })
    .done();

  })
  .done();

  return deferred.promise;
};

/**
 * get Facts for this module provider
 * @param {Object} facts_so_far Facts discovered up to calling this module
 * @return {Object} Promise
 */
Service.getFacts = function (facts_so_far) {
  var self = this,
      facts = {},
      services = {},
      deferred = Q.defer(),
      cmd = '';

  Q.all([
    self._getUpstartList(),
    self._getSysvList(),

  ])
  .done(function (res) {  // was .then()
    var upstart = res[0],
        sysv = res[1];

    services = sysv;
    _.extend(services, upstart);

    facts.services = services;
    deferred.resolve(facts);
  });

  return deferred.promise;
};


module.exports = Service;
