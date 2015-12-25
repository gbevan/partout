/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*global GLOBAL, p2 */
var console = require('better-console'),
  _ = require('lodash'),
  P2 = require('./p2'),
  path = require('path'),
  Q = require('q');

//GLOBAL.p2 = new P2();
//GLOBAL.P2 = P2;
//console.log('GLOBAL:', GLOBAL);

function Policy(args, opts) {
  var self = this,
    deferred = Q.defer();
  //console.log('Policy called with args:', args, 'opts:', opts);
  self.args = args;
  self.app = opts.app;
  if (opts.app.master) {
    self.master = opts.app.master;
  }

  GLOBAL.P2 = P2;
  //GLOBAL.p2 = new P2();
  new P2()
  .then(function (p2) {
    //console.log('p2:', p2);
    GLOBAL.p2 = p2;
    GLOBAL.p2_agent_opts = self.opts = opts;

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
  .done();

  return deferred.promise;
}

//Policy.prototype.... = function () {} ;

Policy.prototype.apply = function () {
  var self = this,
    deferred = Q.defer();
  _.each(self.args, function (a) {

    var abs_a = path.resolve(a);

    delete require.cache[abs_a];
    p2.P2_watchers_close();
    //GLOBAL.p2 = new P2();
    new P2()
    .then(function (p2) {
      GLOBAL.p2 = p2;
      GLOBAL.P2 = P2;

      var p = require(abs_a);

      console.log('### END OF APPLY ################################');
      deferred.resolve();
    })
    .done();
  });
  return deferred.promise;
};

module.exports = Policy;
