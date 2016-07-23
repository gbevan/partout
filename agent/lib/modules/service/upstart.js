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

var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Q = require('q'),
    utils = new (require('../../utils'))(),
    u = require('util'),
    pfs = new (require('../../pfs'))();

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/*
 * Upstart provider for the Service module.
 */
var Service = P2M.Module(module.filename, function () {
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
    var self = this,
        facts = {};

    self.getStatus()
    .done(function (services) {
      facts.services = services;
      deferred.resolve(facts);
    });
  });

});

/**
 * Get Service list and statuses from Upstart
 * @param {string} optional service name to get status for, otherwise get all
 * @returns {Object} Services[name]={desired:..., actual:..., provider: "upstart"}
 */
Service.prototype.getStatus = function (name) {
  var services = {},
      deferred = Q.defer();

  utils.execToArray('initctl list')
  .fail(function (err) {
    // ignore err - only report in debug mode
    utils.dlog('Service upstart getStatus err:', err);
    utils.dlog(err.err.stack);
  })
  .then(function (res) {
    if (!res) {
      return;
    }
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
    if (name) {
      deferred.resolve(services[name]);
    } else {
      deferred.resolve(services);
    }
  });
  return deferred.promise;
};

/**
 * get Facts for this module provider
 * @param {Object} facts_so_far Facts discovered up to calling this module
 * @return {Object} Promise
Service.getFacts = function (facts_so_far) {
  var self = this,
      facts = {},
      deferred = Q.defer();

  self.getStatus()
  .done(function (services) {
    facts.services = services;
    deferred.resolve(facts);
  });

  return deferred.promise;
};
 */

/**
 * Set upstart service to enabled
 * @param   {string} name Service name
 * @returns {object} Promise
 */
Service.prototype.setEnabled = function (name) {
  var override = u.format('/etc/init/%s.override', name);

  return pfs.pExists(override)
  .then(function (exists) {
    if (exists) {
      return Q.nfcall(fs.unlink, override);
    }
  });
};

/**
 * Set upstart service to disabled
 * @param   {string} name Service name
 * @returns {object} Promise
 */
Service.prototype.setDisabled = function (name) {
  return Q.nfcall(fs.writeFile, '/etc/init/' + name + '.override', 'manual\n');
};


module.exports = Service;
