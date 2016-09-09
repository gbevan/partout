/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*jslint node: true, nomen: true, regexp: true, vars: true*/
'use strict';

/*global global, p2 */
var console = require('better-console'),
    _ = require('lodash'),
    P2M = require('./p2m'),
    P2 = require('./p2'),
    path = require('path'),
    Q = require('q'),
    pfs = new (require('./pfs'))(),
    fs = require('fs'),
    //utils = new (require('./utils'))(),
    utils = require('./utils'),
    u = require('util');

function Policy(args, opts) {
  var self = this,
      deferred = Q.defer();

  //console.log('Policy called with args:', args, 'opts:', opts, 'STACK:', (new Error()).stack);
  self.args = args;
  if (opts.app) {
    self.app = opts.app;
    if (opts.app.master) {
      self.master = opts.app.master;
    }
  }

  if (global.p2) {
    p2.P2_watchers_close();
  }

  //global.P2 = P2;
  utils.tlogs('new p2');
  new P2()
  .then(function (p2) {
    utils.tloge('new p2');

    /** @global */
    global.p2 = p2;

    /** @global */
    global.p2_agent_opts = self.opts = opts;

    // Post facts to master
    if (self.master) {
      // TODO: Only post on startup and when facts change !!!
      self.master.post('/facts', p2.facts)
      .fail(function (err) {
        console.error('posting facts to master failed:', err);
      })
      .done();
    }

    if (self.opts.showfacts) {
      p2.print_facts();
    }

    deferred.resolve(self); // resolve passing back this new instance of Policy
  })
  .done(null, function (err) {
    console.error('policy caught err:', err);
    deferred.reject(new Error(err));
  });

  return deferred.promise;
}

Policy.prototype.apply = function () {
  var self = this,
    deferred = Q.defer();

  // TODO: nimble actions in this each loop
  _.each(self.args, function (a) {

    var abs_a = path.resolve(a),
        abs_dir = path.dirname(abs_a),
        p2Re = new RegExp(/\.p2$/);

    /*
     * remove previously load .p2 modules and roles, for reloading
     */
    _.each(require.cache, function (v, k) {
      if (k.match(p2Re)) {
        //console.log('policy: deleting require.cache: k', k);
        delete require.cache[k];
      }
    });

    //delete require.cache[abs_a];
    p2.P2_watchers_close();
    p2.clear_actions();

    p2.__p2dirname = abs_dir;

    /*
     * Load core roles
     */
    var rolespath = path.join('lib', 'roles');

    pfs.pReadDir(rolespath)
    .then(function (roles_manifest) {
      _.each(roles_manifest, function (rfile) {
        rfile = path.join(rolespath, rfile);

        var rfile_stat;
        try {
          rfile_stat = fs.statSync(rfile); // must be sync!
        } catch (e) {
          if (e.code !== 'ENOENT') {
            throw(e);
          }
        }

        if (rfile_stat && rfile_stat.isDirectory()) {
          rfile = path.join(rfile, 'index.p2');
        }

        var r = require(path.resolve(rfile));
      });

      require(abs_a);

      // execute the accrued steps
      p2.end(function () {

        utils.vlog('### END OF APPLY ################################');
        deferred.resolve();
      });

    })
    .done(null, function (err) {
      console.error('Policy load of roles failed');
      deferred.reject(err);
    });
  });
  return deferred.promise;
};

module.exports = Policy;
