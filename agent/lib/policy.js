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
    pfs = require('./pfs'),
    fs = require('fs'),
    utils = require('./utils'),
    u = require('util');

function Policy(args, opts) {
  var self = this;

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

  utils.tlogs('new p2');

  return new P2()
  .then(function (p2) {
    utils.tloge('after new p2');

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

    return Q.resolve(self);
  });

}

Policy.prototype.apply = function () {
  var self = this,
    deferred = Q.defer();

  // TODO: nimble actions in this each loop
  _.each(self.args, function (a) {

    var abs_a = path.resolve(a),
        abs_dir = path.dirname(abs_a),
        p2Re = new RegExp(/\.p2$/);

    p2.P2_watchers_close();
    p2.clear_actions();

    p2.__p2dirname = abs_dir;

    require(abs_a);

    // execute the accrued steps
    p2.end(function () {

      utils.vlog('### END OF APPLY ################################');
      deferred.resolve();
    });

  });
  return deferred.promise;
};

module.exports = Policy;
