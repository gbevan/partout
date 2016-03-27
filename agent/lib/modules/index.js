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
    nimble = require('nimble'),
    utils = new (require('../utils.js'))(),
    u = require('util');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/*
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

modules.unshift('facts/index.js');

/*
 * module load with or without facts (if already cached)
 */
module.exports = function (facts) {
  // dynamically load modules
  var _exports = {},
    deferred = Q.defer(),
    facts_promises = [],
    facts_funcs = [];

//  if (!facts || typeof(facts) !== 'object') {
//    var err = new Error('ERROR: modules loaded without a facts object');
//    console.error(err, '\nstack:' + err.stack);
//    throw err;
//  }

  _.every(modules, function (m) {
    utils.dlog('****************************');
    utils.dlog('loading module file:', m);
    m = './' + m;
    var M = require(m),
        C = new M();
    utils.dlog('M:', u.inspect(M, {colors: true, depth: 3}));
    utils.dlog('C:', u.inspect(C, {colors: true, depth: 3}));

    if (facts && C.getFacts) {
      facts_funcs.push(function (done) {

        // TDOD: use just one getName()
        utils.dlog('modules/index: module instance name:', (C.getName ? C.getName() : M.getName()));

        C.getFacts(facts)
        .then(function (m_facts) {
          //utils.dlog('modules/index: module returned facts:', m_facts);
          if (m_facts) {
            _.merge(facts, m_facts);
          }
          done();
        })
        .done();
      });
    }
    //console.log('exporting module:', m);
    _exports[
      (C.getName ? C.getName() : M.getName())
    ] = M;
    return true;
  });

  if (!facts) {
    deferred.resolve(_exports);
  }

  facts_funcs.push(function (done) {
    deferred.resolve(_exports);
    done(); // nimble cb
  });
  nimble.series(facts_funcs);

  return deferred.promise;
};
