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
    utils = new (require('./utils'))(),
    Mustache = require('mustache');

Q.longStackSupport = true;


var P2Test = {

  /**
   * Run a p2 policy from a string
   * @param {string} p2 Policy expression in p2
   */
  runP2Str: function(p2Str, vars) {

    var deferred = Q.defer(),
        p2 = Mustache.render(p2Str, vars, {});

    p2 = utils.escapeBackSlash(p2);

    //console.log('p2Test cmd:', p2);

    utils.tlogs('tmp.file');
    tmp.file({keep: false}, function (err, tpath, fd, cleanupcb) {
      utils.tloge('tmp.file');

      if (err) {
        throw err;
      }

      fs.write(fd, p2, 0, 'utf8', function (err) {

        utils.tlogs('new Policy');
        new Policy([tpath], {apply: true})
        .done(function (policy) {
          utils.tloge('new Policy');

          utils.tlogs('policy apply');
          policy.apply()
          .done(function () {
            utils.tloge('policy apply');

            deferred.resolve();
          });
        });
      });
    });

    return deferred.promise;
  },

  getP2Facts: function () {
//    args = (args ? args : {});

    var deferred = Q.defer();

    if (GLOBAL.p2) {
      delete GLOBAL.p2.facts;
    }
//    console.log('GLOBAL debug:', GLOBAL.partout.opts);

    new Policy({}, {daemon: false, showfacts: false})
    .done(function (policy) {
      //console.log('facts:', GLOBAL.p2.facts);
      //console.log('p2_test.js GLOBAL.p2.facts.installed_packages[nginx]:', GLOBAL.p2.facts.installed_packages.nginx);
      deferred.resolve(GLOBAL.p2.facts);
    });

    return deferred.promise;
  }

};

module.exports = P2Test;
