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

/*jslint node: true */
'use strict';

var Q = require('q'),
    tmp = require('tmp'),
    fs = require('fs'),
    Policy = require('./policy'),
    utils = require('./utils'),
    Mustache = require('mustache'),
    console = require('better-console');

Q.longStackSupport = true;


var P2Test = {

  /**
   * Run a p2 policy from a string
   * @param {string} p2 Policy expression in p2
   */
  runP2Str: function(p2Str, vars) {

    var deferred = Q.defer();
    p2Str = Mustache.render(p2Str, vars, {});

    p2Str = utils.escapeBackSlash(p2Str);

    utils.tlogs('tmp.file');
    tmp.file({keep: false}, function (err, tpath, fd, cleanupcb) {
      utils.tloge('tmp.file');

      if (err) {
        throw err;
      }

      fs.write(fd, p2Str, 0, 'utf8', function (err) {

        utils.tlogs('new Policy');
        new Policy([tpath], {apply: true})
        .then(function (policy) {
          utils.tloge('new Policy');


          utils.tlogs('policy apply');
          policy.apply()
          .then(function () {
            utils.tloge('policy apply');

            deferred.resolve();
          }, function (err) {
            deferred.reject(new Error(err));
          });
        })
        .done(null, function (err) {
          deferred.reject(err);
        });
      });
    });

    return deferred.promise;
  },

  getP2Facts: function () {
    if (global.p2) {
      delete global.p2.facts;
    }

    return new Policy({}, {daemon: false, showfacts: false})
    .then(function (policy) {
      return global.p2.facts;
    });

  }

};

module.exports = P2Test;
