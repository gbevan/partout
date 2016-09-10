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
    pfs = require('../../pfs'),
    sysv = new (require('./sysv'))();

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
      facts = {},
      services = {},
      cmd = '';
    //console.log('redhat getFacts()');

    var sysv_promise = sysv.getFacts(facts_so_far),
        systemd_deferred = Q.defer();

    pfs.pExists('/usr/bin/systemctl')
    .then(function (systemd) {
      //console.log('redhat systemd');

      if (!systemd) {
        systemd_deferred.resolve();
        return;
      }

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
        systemd_deferred.resolve({services: services});
      })
      .fail(function (err) {
        console.error('Service redhat getFacts failed:', err, '\n', err.stack);
        systemd_deferred.resolve();
      })
      .done();
    });

    Q.all([sysv_promise, systemd_deferred.promise])
    .then(function (p_arr) {
      var facts = {services: {}},
          sysv_facts = p_arr[0],
          systemd_facts = p_arr[1];

      if (sysv_facts) {
        facts.services = sysv_facts.services;
      }

      if (systemd_facts) {
        _.merge(facts, systemd_facts);
      }

      deferred.resolve(facts);
    });

  }) // facts

  ///////////////
  // Run Action
  .action(function (args) {

    var deferred = args.deferred,
        //inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '';

    utils.dlog('Service redhat: in action TODO: ############################ name:', opts.name, 'ensure:', opts.ensure);

    deferred.resolve();
    //deferred.resolve({result: 'changed'});
  }, {immediate: true}); // action

});


module.exports = Service;
