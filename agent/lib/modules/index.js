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

/*jslint node: true, nomen: true */
'use strict';

var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  mydir = path.dirname(module.filename),
  Q = require('q'),
  nimble = require('nimble');

/**
 * get list of modules (either .js or folders.
 */
var modules_top = _.remove(
    fs.readdirSync(mydir), // TODO: walk?
    function (m) {
      var f = path.join(mydir, m),
        isDir = fs.statSync(f).isDirectory();
      if (isDir) {
        return m != 'facts';
      } else {
        return m.match(/\.js$/) !== null && m !== 'index.js' && m != 'facts.js';
      }
    }
  );

var modules = modules_top.map(function (m) {
  if (m.match(/\.js$/)) {
    return m;
  } else {
    return path.join(m, 'index.js');
  }
});

Q.longStackSupport = true;

modules.unshift('facts/index.js');

module.exports = function (facts) {
  // dynamically load modules
  var _exports = {},
    deferred = Q.defer(),
    facts_promises = [],
    facts_funcs = [];

  _.every(modules, function (m) {
    //console.log('module file:', m);
    m = './' + m;
    var M = require(m);
    //console.log('M name:', M.getName());

    if (facts && M.getFacts) {
      facts_funcs.push(function (done) {
        //console.log('module name:', M.getName());
        M.getFacts(facts)
        .then(function (m_facts) {
          //console.log('module returned facts:', m_facts);
          if (m_facts) {
            _.merge(facts, m_facts);
          }
          done();
        })
        .done();
      });
    }
    //console.log('exporting module:', m);
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

  return deferred.promise;
};
