/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2017 Graham Lee Bevan <graham.bevan@ntlworld.com>

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
    spawn = require('child_process').spawn,
    os = require('os'),
    pfs = require('../pfs'),
    u = require('util');

var debug = require('debug').debug('partout:capture:netdep');

var INTERVALSECS = 60,
    LSOF = '/usr/bin/lsof',
    IP = '/sbin/ip';

var NetDep = function () {
  this.nics = {};
  this.myIps = {
    IPv4: {},
    IPv6: {}
  };
};

NetDep.prototype.parse_ipaddr = function (o) {
  var self = this,
      nicRe = /^\d+:\s+(\w+):.*$/,
      inetRe = /^\s+inet\s+(\d+\.\d+\.\d+\.\d+).*$/,
      inet6Re = /^\s+inet6\s+([:0-9a-z]+)\/.*$/,
      currentNic = '';

//  debug('o:', o);
  o.split(/\r?\n/)
  .forEach(function (l) {
//    debug('parse_ipaddr l:', l);

    var nicMatch = l.match(nicRe);
//    debug('nicMatch:', nicMatch);
    if (nicMatch) {
      currentNic = nicMatch[1];
      self.nics[currentNic] = {
        IPv4: {},
        IPv6: {}
      };
      return;
    }

    var inetMatch = l.match(inetRe);
//    debug('inetMatch:', inetMatch);
    if (inetMatch) {
      self.nics[currentNic].IPv4.ip = inetMatch[1];
      self.myIps.IPv4[inetMatch[1]] = true;
      return;
    }

    var inet6Match = l.match(inet6Re);
//    debug('inet6Match:', inet6Match);
    if (inet6Match) {
      self.nics[currentNic].IPv6.ip = inet6Match[1];
      self.myIps.IPv6[inet6Match[1]] = true;
      return;
    }
  });

//  debug('nics:', self.nics);
};

NetDep.prototype.getAllNics = function () {
  var self = this;

  return new Promise((resolve, reject) => {

  var ipaddr = spawn(IP, ['addr']),
      ipaddr_output = '';

    ipaddr.on('error', function (err) {
      console.error('Failed to spawn', IP, 'err:', err);
    });

    ipaddr.stderr.on('data', function (stderr) {
      console.error('stderr');
    });

    ipaddr.stdout.on('data', function (data) {
      ipaddr_output += data;
    });

    ipaddr.on('close', function (rc) {
//      console.log(IP, 'addr completed rc:', rc);
//      console.log(ipaddr_output);
      self.parse_ipaddr(ipaddr_output);
      resolve();
    });
  });
};

NetDep.prototype.init_buckets = function () {
  var self = this;
  this.buckets = {datetime: new Date()};

  _.range(1, 25)
  .forEach(function (hour) {
    self.buckets[hour] = {
      IPv4: {},
      IPv6: {}
    };
  });

};

NetDep.prototype.parse_lsof = function (o) {
  var self = this,
      hour = (new Date()).getHours();
//  console.log('nics:', snics);

  _.each(self.nics, function (nic_o, name) {
//    debug('nic name:', name, 'nic_o:', nic_o);

    if (nic_o.IPv4.ip) {
      if (!self.buckets[hour].IPv4[nic_o.IPv4.ip]) {
        self.buckets[hour].IPv4[nic_o.IPv4.ip] = {
          nic: name,
          listeners: {
            UDP: {},
            TCP: {}
          },
          connections: {
            UDP: {},
            TCP: {}
          }
        };
      }
    }

    if (nic_o.IPv6.ip) {
      if (!self.buckets[hour].IPv6[nic_o.IPv6.ip]) {
        self.buckets[hour].IPv6[nic_o.IPv6.ip] = {
          nic: name,
          listeners: {
            UDP: {},
            TCP: {}
          },
          connections: {
            UDP: {},
            TCP: {}
          }
        };
      }
    }

  });

//  debug('buckets:', u.inspect(this.buckets, {depth: 4, color: true}));

  ['listeners', 'connections'].forEach(function (phase) {

    o.split(/\r?\n/)
    .slice(1)
    .forEach(function (l) {
  //    console.log('l:', l);
      var parts = l.split(/\s+/),
          stateRe = /^(\*|\d[^:]*|\[[^\]]*\]):(\d+)(\-?\>?)(|(\*|\d[^:]*|\[[^\]]*\]):(\d+))$/;

      var cmd = parts[0],
          pid = parts[1],
          user = parts[2],
          ipversion = parts[4],
          proto = parts[7],
          conn = parts[8],
          state = parts[9],
          conn_m;
      if (conn) {
  //      if (proto === 'UDP') debug('conn:', conn);
        conn_m = conn.match(stateRe);
  //      if (proto === 'UDP') debug('conn_m:', conn_m);

        var conn_from_ip = conn_m[1];
        conn_from_ip = conn_from_ip.replace(/[\[\]]/g, '');
  //      debug('conn_from_ip:', conn_from_ip);
        var conn_from_port = conn_m[2];
        var conn_to_ip = conn_m[5];
        if (conn_to_ip) {
          conn_to_ip = conn_to_ip.replace(/[\[\]]/g, '');
        }
        var conn_to_port = conn_m[6];

        if (phase === 'listeners' && (state.match(/.*LISTEN*./) || proto === 'UDP')) {
          if (conn_from_ip === '*') {
            // apply to all nic ips
            _.each(self.buckets[hour][ipversion], function (v, ip) {
              self.buckets[hour][ipversion][ip].listeners[proto][conn_from_port] = {connections: {}};
            });
          } else {
            self.buckets[hour][ipversion][conn_from_ip].listeners[proto][conn_from_port] = {connections: {}};
          }

        } else if (phase === 'connections' && state.match(/.*ESTABLISHED.*/)) {

          if (!self.buckets[hour][ipversion][conn_from_ip]) {
            self.buckets[hour][ipversion][conn_from_ip] = {
              connections: {
                UDP: {},
                TCP: {}
              },
              listeners: {
                UDP: {},
                TCP: {}
              }
            };
          }

          if (self.buckets[hour][ipversion][conn_from_ip].listeners[proto][conn_from_port]) { // has listener
            // INBOUND
            debug('inbound', self.buckets[hour][ipversion][conn_from_ip].listeners[proto][conn_from_port]);
            debug('conn_from_ip:', conn_from_ip, 'conn_from_port:', conn_from_port);
            self.buckets[hour][ipversion][conn_from_ip].listeners[proto][conn_from_port]
              .connections[conn_to_ip + ':' + conn_to_port] = {state: 'established', direction: 'inbound'};

          } else {
            // OUTBOUND
            debug('outbound', self.buckets[hour][ipversion][conn_from_ip].connections[proto]);
            self.buckets[hour][ipversion][conn_from_ip].connections[proto][conn_from_port] = {};
            self.buckets[hour][ipversion][conn_from_ip].connections[proto][conn_from_port][conn_to_ip + ':' + conn_to_port] = {state: 'established', direction: 'outbound'};
          }
        }

      }

    });

  }); // phases

  debug('buckets:', u.inspect(this.buckets, {depth: 8, color: true}));
//  process.exit(1);
};

NetDep.prototype.start = function () {
  var self = this;

  this.init_buckets();
//  console.log('NetDep starting, buckets:', this.buckets);

  var intvl = setInterval(function () {

    if (self.buckets.datetime.toDateString() !== (new Date()).toDateString()) {
      self.init_buckets();
    }

    self.getAllNics()
    .then(function () {
      return pfs.pExists(LSOF);
    })
    .then(function (exists) {
      var lsof = spawn(LSOF, ['-nP', '-i']),
          lsof_output = '';

      lsof.on('error', function (err) {
        console.error('Failed to spawn', LSOF, 'err:', err);
        clearInterval(intvl);
      });

      lsof.stderr.on('data', function (stderr) {
        console.error(stderr);
      });

      lsof.stdout.on('data', function (data) {
        lsof_output += data;
      });

      lsof.on('close', function (rc) {
//        console.log(LSOF, 'completed rc:', rc);
//        console.log(lsof_output);
        self.parse_lsof(lsof_output);
      });

    });
  }, 1000 * INTERVALSECS);
};

NetDep.prototype.get = function () {
  return this.buckets;
};

module.exports = NetDep;
