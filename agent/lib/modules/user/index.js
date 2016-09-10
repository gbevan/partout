/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*jslint node: true, nomen: true, vars: true*/
/*global p2 */
'use strict';

var console = require('better-console'),
    u = require('util'),
    P2M = require('../../p2m'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    utils = require('../../utils'),
    pfs = require('../../pfs'),
    Mustache = require('mustache'),
    Q = require('q');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

var User = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('user')

  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        user: {
          loaded: true
        }
      }
    };
    deferred.resolve(facts);
  })

  ////////////////
  // Action
  .action(function (args) {
    var deferred = args.deferred,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '';
    utils.dlog('User index: in action ############################');

    // defaults
    if (!opts.name) {
      opts.name = title;
    }
    if (!opts.ensure) {
      opts.ensure = 'present';
    }

    deferred.resolve();
  });

});

User.prototype.setProvider = function (facts) {
  var self = this;
  utils.dlog('User setProvider() self:', self);
  utils.dlog('User setProvider() self.provider:', self.provider, 'os family:', facts.os_family);
  //process.exit(1);
  if (facts.os_type === 'Linux') {
    return 'linux';
  } else if (facts.os_type === 'windows') {
    return 'windows';
  }

  return null;
};

module.exports = User;
