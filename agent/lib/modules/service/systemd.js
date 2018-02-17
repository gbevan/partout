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
    utils = require('../../utils'),
    u = require('util');

Q.longStackSupport = true;

Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

var Service = function () {

};

/**
 * Get Service list and statuses from systemctl
 * @param {string} optional service name to get status for, otherwise get all
 * @returns {Object} Services[name]={desired:..., actual:..., provider: "upstart"}
 */
Service.prototype.getStatus = function (name) {
  var services = {},
      deferred = Q.defer();

  // get all unit files and their statuses
  utils.execToArray('systemctl --no-legend --no-pager list-unit-files *.service')
  .then(function (ufiles_res) {
    if (!ufiles_res) {
      return;
    }
    var ufiles_lines = ufiles_res.outlines;
    _.forEach(ufiles_lines, function (uf_line) {
      uf_line = uf_line.trim();
      if (uf_line === '') {
        return;
      }
      var uf_m = uf_line.match(/^(\S*)\.service\s+(\w+)/);
      if (uf_m) {
        services[uf_m[1]] = {
          desired: 'unknown',
          actual: uf_m[2],
          provider: 'systemd'
        };
      }
    });
  })
  .then(() => {
    return utils.execToArray('systemctl --no-legend --no-pager list-units *.service');
  })
  .then(function (units_res) {
    if (!units_res) {
      return;
    }
    var units_lines = units_res.outlines;
    _.forEach(units_lines, function (unit_line) {
      unit_line = unit_line.trim();
      if (unit_line === '') {
        return;
      }
      var unit_m = unit_line.match(/^(\S*)\.service\s+(\w+)\s(\w+)\s(\w+)\s(.*)$/);
      if (unit_m) {
        services[unit_m[1]] = {
          desired: unit_m[3],
          actual: unit_m[4],
          provider: 'systemd'
        };
      }
    });
//    console.log('systemd name:', name, 'service:', services[name]);
    if (name) {
      deferred.resolve(services[name]);
    } else {
      deferred.resolve(services);
    }
  })
  .fail(function (err) {
    // ignore err - only report in debug mode
    utils.dlog('Service systemctl list-unit-files getStatus err:', err);
    utils.dlog(err.err.stack);
  });
  return deferred.promise;
};

/**
 * Set systemd service to enabled
 * @param   {string} name Service name
 * @returns {object} Promise
 */
Service.prototype.setEnabled = function (name) {
//  console.warn('service systemd setEnabled not yet available');
  return utils.pExec('/bin/systemctl enable ' + name);
};

/**
 * Set systemd service to disabled
 * @param   {string} name Service name
 * @returns {object} Promise
 */
Service.prototype.setDisabled = function (name) {
//  console.warn('service systemd setDisabled not yet available');
  return utils.pExec('/bin/systemctl disable ' + name);
};

module.exports = Service;
