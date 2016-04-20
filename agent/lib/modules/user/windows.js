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
    Q = require('q'),
    utils = new (require('../../utils'))(),
    assert = require('assert'),
    u = require('util');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/*
 * Windows Provider for the User module.
 *
 */
var User = P2M.Module(module.filename, function () {
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

    if (utils.pIsAdmin()) {

      utils.runPs('Get-WmiObject -Class Win32_UserAccount | ConvertTo-Json -compress')
      .done(function (res) {
        var rc = res[0],
            stdout = res[1],
            stderr = res[2],
            res_array = JSON.parse(stdout),
            users = {};

        res_array.forEach(function (u) {
          users[u.Name] = u;
        });

        //_.each(users, function (v, k) {
        //  console.log('user:', k);
        //});

        facts.users = users;
        deferred.resolve(facts);
      });

    } else {
      deferred.resolve(facts);
    }
  })

  ;

});

module.exports = User;
