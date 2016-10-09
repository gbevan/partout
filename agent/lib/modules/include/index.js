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

/*jslint node: true, nomen: true */
'use strict';

/* global p2 */

var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    Q = require('q'),
    utils = require('../../utils'),
    u = require('util'),
    path = require('path'),
    pfs = require('../../pfs'),
    stringArgv = require('string-argv');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

var Include = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */
  self

  ////////////////////
  // Name this module
  .name('include')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        Include: {
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
        inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '',
        file = title,
        absfile = (path.isAbsolute(file) ? file : path.join(p2.__p2dirname, file));

    // If absfile is a directory, then load index.p2
    var absfile_stat;
    try {
      absfile_stat = fs.statSync(absfile); // must be sync!
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw(e);
      }
    }

    if (absfile_stat && absfile_stat.isDirectory()) {
      absfile = path.join(absfile, 'index.p2');
    }

    if (!absfile.match(/\.(p2|js)$/)) {
      absfile = u.format('%s.p2', absfile);
    }

    if (utils.isVerbose()) {
      console.info('Including file', absfile);
    }

    try {
      require(absfile);
    } catch (e) {
      console.error('failed to include file:', absfile);
      throw(e);
    }

    deferred.resolve();

  }, {immediate: true}) // action

  // placeholder for stepped runAction
  .action(function (args) {
    var deferred = args.deferred;

    deferred.resolve();
  })
  ;

});

module.exports = Include;
