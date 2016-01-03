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

/*jslint node: true, nomen: true */
'use strict';

var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  modules = _.remove(
    fs.readdirSync(path.dirname(module.filename)), // TODO: walk?
    function (m) {
      return m.match(/\.js$/) !== null && m !== 'index.js' && m != 'facts.js';
    }
  ),
  Q = require('q'),
  nimble = require('nimble');

Q.longStackSupport = true;

modules.unshift('facts.js');

module.exports = function (facts) {
  // dynamically load modules
  var _exports = {},
    deferred = Q.defer(),
    facts_promises = [],
    facts_funcs = [];

  _.every(modules, function (m) {
    m = './' + m;
    var M = require(m);

    if (facts && M.getFacts) {
      //facts_promises.push(M.getFacts());
      facts_funcs.push(function (done) {
        //console.log('module name:', M.getName());
        M.getFacts(facts)
        .then(function (m_facts) {
          if (m_facts) {
            _.merge(facts, m_facts);
          }
          done();
        })
        .done();
      });
    }
    _exports[M.getName()] = M;
    return true;
  });

  if (!facts) {
    deferred.resolve(_exports);
  }

  facts_funcs.push(function (done) {
    deferred.resolve(_exports);
    done();
  });
  nimble.series(facts_funcs);

  /*
  Q.all(facts_promises)
  .then(function (ar_facts) {
    _.forEach(ar_facts, function (mFacts) {
      if (facts) {
        //console.log(_o.name, 'facts:', _o.facts);
        if (mFacts) {
          _.merge(facts, mFacts);
        }
      }
    });
    //console.log('merged facts:', facts);
    deferred.resolve(_exports);
  });
  */
  return deferred.promise;
};
