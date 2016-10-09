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

/*global p2*/
var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    Q = require('q'),
    utils = require('../../utils'),
    u = require('util'),
    pfs = require('../../pfs'),
    Mustache = require('mustache'),
    stringArgv = require('string-argv');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/**
 * @module lambda
 *
 * @description
 * lambda module
 * ==============
 *
 *     p2.node([...])
 *       .lambda('title', options, function(facts, options) {...});
 *
 * options:
 *   - anything goes, they are passed to the function.
 */

var Lambda = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('lambda')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        Lambda: {
          loaded: true
        }
      }
    };

    deferred.resolve(facts);
  })

  //////////////////
  // Action handler
  .action(function (args) {

    var deferred = args.deferred,
        //inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts,
        lambda_fn,
        errmsg = '';

    if (typeof args.opts === 'function') {
      lambda_fn = args.opts;
      opts = {};
    } else {
      lambda_fn = args.cb;
      opts = args.opts;
    }

    if (lambda_fn) {
      deferred.resolve(
        lambda_fn(_impl.facts, opts)
      );
    }

  });

});

module.exports = Lambda;
