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
    assert = require('assert'),
    u = require('util'),
    linuxUser = require('linux-user');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/*
 * Linux provider for the User module.
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
    //console.warn('User test module for linux loaded');
    //process.exit(1);

    linuxUser.getUsers(function (err, users_list) {
      if (err) {
        console.error('user module failed to get users, err:', err);
        deferred.resolve({});
        return;
      }

      //facts.users_list = users_list;

      // pivot users list into keyed objects
      var users = {};
      users_list.forEach(function (u) {
        users[u.username] = u;
      });

      facts.users = users;

      deferred.resolve(facts);
    });
  })

  ///////////////
  // Run Action
  .action(function (args) {

    var deferred = args.deferred,
        //inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        name = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '';

    utils.dlog('user linux: in action ############################ name:', opts.name, 'ensure:', opts.ensure);
    console.log('user linux: in action ############################ name:', opts.name, 'ensure:', opts.ensure);

    if (opts.ensure.match(/^present$/)) {
      console.warn(u.format('Adding user %s', name));
      linuxUser.addUser(name, function (err, user) {
        if (err) {
          console.error('addUser failed, err:', err);
        }
        console.log(u.format('User %s added', name));
        deferred.resolve();
        return;
      });

    } else if (opts.ensure.match(/^absent$/)) {
      console.warn(u.format('removing user %s', name));
      linuxUser.removeUser(name, function (err) {
        if (err) {
          console.error('removeUser failed, err:', err);
        }
        console.log(u.format('User %s deleted', name));
        deferred.resolve();
        return;
      });

    } else {
      console.error('user module does not support ensure option value of:', opts.ensure);
//        next_step_callback();
      deferred.resolve();
    }

  }, {immediate: true})

  ;

});

module.exports = User;
