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

  next_step_callback(); // when finished
};

Service.getFacts = function (facts_so_far) {
  var self = this,
      facts = {},
      services = {},
      deferred = Q.defer(),
      cmd = '';
  //console.log('redhat getFacts()');

  //utils.execToArray('/usr/bin/gdbus call --system --dest org.freedesktop.systemd1 --object-path /org/freedesktop/systemd1 --method org.freedesktop.systemd1.Manager.ListUnits')
  utils.execToArray('/usr/bin/systemctl list-units *.service | grep "\.service"')
  .then(function (res) {
    //console.log('res:', res);
    var u_lines = res.outlines;
    //console.log('u_lines:', u_lines);

    /*
     * parse each line for status
     * e.g.
     * sshd.service                           loaded active running OpenSSH server daemon
     */
    var services = {};
    u_lines.forEach(function (ul) {
      var ul_m = ul.match(/^(\S+)\s+(\w+)\s+(\w+)\s+(\w+)\s+(.*)/);
      if (ul_m) {
        var u_name = ul_m[1],
            u_desired = ul_m[3],
            u_status = ul_m[4];
        services[u_name] = {
          desired: u_desired,
          actual: u_status,
          provider: 'systemd'
        };
      }
    });
    deferred.resolve({services: services});
  })
  .done();

  return deferred.promise;
};


module.exports = Service;
