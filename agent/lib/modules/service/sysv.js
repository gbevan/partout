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
    utils = require('../../utils'),
    u = require('util');

Q.longStackSupport = true;

Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

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
 * Get the current sysv runlevel
 * @returns {Object} Promise -> runlevel
 */
Service.prototype._getRunLevel = function () {
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
 * Get services statuses from service --status-all
 * @returns {object} services
 */
Service.prototype.getServiceAll = function () {
  var deferred = Q.defer(),
      services = {};

  // XXX: May need to readdir /etc/init.d/ for executable scripts to preseed services...

  utils.execToArray('service --status-all 2>&1')
  .done(function (res) {
    var sysv_lines = res.outlines,
        inner_deferreds = [];

    _.forEach(sysv_lines, function (sysv_line) {
      var sysv_m1 = sysv_line.match(/^\s*\[\s*(\+|\-|\?)\s*\]\s*(.*)/),
          sysv_m2 = sysv_line.match(/^([\w\-]+).*(stopped|running).*/);
      //console.log('service debian sysv_m:', sysv_m);
      var sysv_desired = 'unknown',
          sysv_name,
          sysv_status;
      if (sysv_m1) {
        sysv_name = sysv_m1[2];
        sysv_status = sysv_m1[1];
        sysv_status = (sysv_status === '+' ? 'running' : (sysv_status === '-' ? 'stopped' : 'unknown'));
      } else if (sysv_m2) {
        sysv_name = sysv_m2[1];
        sysv_status = sysv_m2[2];
      } else {
        return; // next in forEach sysv_lines
      }

      services[sysv_name] = {
        desired: sysv_desired,
        actual: sysv_status,
        provider: 'sysv'
      };

    });
    deferred.resolve(services);
  });

  return deferred.promise;
};

/**
 * Get sysv services that are enabled for the current runlevel
 * @returns {Object} Promise -> {service: true, ...}
 */
Service.prototype._getSysvEnabled = function (services) {
  var self = this,
      deferred = Q.defer();

  self._getRunLevel()
  .done(function (runlevel) {
    // get list of file links in /etc/rc?.d/S??name for desired state
    Q.nfcall(fs.readdir, '/etc/rc' + runlevel + '.d/')
    .done(function (files) {
      //var file_hash = {};

      files.forEach(function (e) {
        var me = e.match(/^S(\d{2})(.*)/);
        if (me) {
          var desired_state = 'start',
              order = me[1],
              name = me[2];
          //file_hash[me[1]] = true;
          if (services[name]) {
            services[name].desired = desired_state;
            services[name].order = order;
          } else {
            services[name] = {
              desired: desired_state,
              actual: 'unknown',
              order: order,
              provider: 'sysv'
            };
          }
        }
      });
      deferred.resolve(services);
    });
  });

  return deferred.promise;
};

Service.prototype._getSysvStatus = function (services) {
  var self = this,
      deferred = Q.defer(),
      inner_deferreds = [];

  _.forEach(services, function(s, name) {
    var d = Q.defer();
    inner_deferreds.push(d.promise);

    if (s.actual === 'unknown') {
      utils.execToArray('service ' + name + ' status')
      .then(function (res) {
        s.actual = (res.rc === 0 ? 'running' : 'stopped');
        d.resolve();
      })
      .fail(function (err) {
        s.actual = 'unknown';
        d.resolve();
      })
      .done();
    } else {
      d.resolve();
    }

  });

  Q.all(inner_deferreds)
  .done(function () {
    deferred.resolve(services);
  });

  return deferred.promise;
};

/**
 * Get sysv service list and status
 * @returns {Object} Services[name]={desired:..., actual:..., provider: "upstart"}
 */
Service.prototype.getStatus = function (name) {
  var self = this,
      deferred = Q.defer();

  self.getServiceAll()
  .then(function (services) {
    return self._getSysvEnabled(services);
  })
  .then(function (services) {
    return self._getSysvStatus(services);
  })
  .done(function (services) {

    if (name) {
      deferred.resolve(services[name]);
    } else {
      deferred.resolve(services);
    }

  });

  return deferred.promise;
};

/**
 * Set sysv service to enabled
 * @param   {string} name Service name
 * @returns {object} Promise
 */
Service.prototype.setEnabled = function (name) {
  //return utils.pExec('/usr/sbin/update-rc.d ' + name + ' enabled');
  return utils.pExec('/usr/sbin/update-rc.d ' + name + ' enable');
};

/**
 * Set sysv service to disabled
 * @param   {string} name Service name
 * @returns {object} Promise
 */
Service.prototype.setDisabled = function (name) {
  //return utils.pExec('/usr/sbin/update-rc.d ' + name + ' disabled');
  return utils.pExec('/usr/sbin/update-rc.d ' + name + ' disable');
};


module.exports = Service;
