/*jshint newcap: false*/
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
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Q = require('q'),
    cfg = new (require('../../../etc/partout_agent.conf.js'))(),
    path = require('path'),
    //pickle = require('pickle'),
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
    var facts = {};

    utils.runPs('$PSVersionTable | ConvertTo-Json -Compress')
    .then(function (res) {
      var rc = res[0],
          stdout = res[1],
          stderr = res[2];
      facts.PSVersionTable = JSON.parse(stdout);

      return utils.runPs('$PSVersionTable.PSVersion | ConvertTo-Json -Compress');
    })
    .then(function (res) {
      var rc = res[0],
          stdout = res[1],
          stderr = res[2];
      facts.PSVersion = JSON.parse(stdout);

      return utils.runPs('[string]$PSVersionTable.PSVersion');
    })
    .then(function (res) {
      var rc = res[0],
          stdout = res[1],
          stderr = res[2];
      facts.PSVersion_String = res[1].trim();

      return utils.runPs('Get-WmiObject -Query "SELECT * FROM Win32_LogicalDisk" | ConvertTo-Json -Compress');
    })
    .then(function (res) {
      var rc = res[0],
          stdout = res[1],
          stderr = res[2];
      facts.LogicalDisks = JSON.parse(stdout);

      deferred.resolve(facts);
    })
    .done(null, function (err) {
      deferred.reject(err);
    });

  })

  ;

});


module.exports = Facts;
