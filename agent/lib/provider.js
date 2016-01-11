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

var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    mydir = path.dirname(module.parent.filename),
    console = require('better-console');

/**
 * getProvider module spcecifc to operating system, os flavour or os type
 * @param   {object}  facts Discovered facts.
 * @returns {Promise} promise resolves to module loaded.
 */
var getProvider = function (facts) {
  var deferred = Q.defer();

  // Provider search list
  var srchJsList = [
    path.join(mydir, facts.dist_id + '.js'),         // (1) Operating System Specific Provider?
    path.join(mydir, facts.os_family + '.js'), // (2) Operating System Family Provider?
    path.join(mydir, facts.os_type + '.js')          // (3) Operating System Type Provider?
  ];

  var promises = [];
  srchJsList.forEach(function (js) {
    promises.push(function (js) {
      console.log('check for provider:', js);
      var inner_deferred = Q.defer();
      fs.exists(js, function (exists) {
        if (exists) {
          var M = require(js);
          inner_deferred.resolve(M);
        } else {
          inner_deferred.resolve();
        }
      });
      return inner_deferred.promise;
    }(js));
  });

  Q.all(promises)
  .done(function (arr_p) {
    console.log('arr_p:', arr_p);
    var M;
    arr_p.forEach(function (p) {
      if (!M && p) {
        M = p;
      }
    });
    if (M) {
      deferred.resolve(M);
    } else {
      console.error('Provider not found for this OS');
      deferred.resolve();
    }
  });

  return deferred.promise;
};

/**
 * Provider constructor - to be inherited by other modules.
 * @returns {object} n/a
 */
var Provider = function () {
  return {};
};

// run action (from P2 directive)
Provider.runAction = function (next_step_callback, args) {
  var self = this;  // self is _impl

  //console.warn('Provider runAction called args:', args, 'facts:', self.facts);

  getProvider(self.facts)
  .then(function (PM) {
    console.log('Provider runAction resolved PM:', PM);
    console.warn('next_step_callback:', next_step_callback);
    args.unshift(next_step_callback);
    PM.runAction.apply(self, args);
  })
  .done();
};

/**
 * getFacts() wrapper for provided modules.
 * @param   {object}  facts_so_far Facts discovered so far by P2
 * @returns {Promise} Promise Resolves to facts discovered by this module.
 */
Provider.getFacts = function (facts_so_far) {
  var deferred = Q.defer(),
    facts = {};
  //console.log('Provider getFacts() os family:', facts_so_far.os_dist_id_like);

  getProvider(facts_so_far)
  .then(function (PM) {
    console.log('Provider getFacts resolved PM:', PM);
    deferred.resolve(PM.getFacts(facts_so_far));
  });

  return deferred.promise;
};

module.exports = Provider;
