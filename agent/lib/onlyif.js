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

/*global p2*/

var Q = require('q'),
    utils = require('./utils'),
    pfs = require('./pfs');

var onlyif = function (opts) {

  var onlyif_deferred = Q.defer();
  if (opts && opts.onlyif) {
    var onlyif_content_deferred = Q.defer();

    if (typeof(opts.onlyif) === 'object') { // handle {file:..., args:[...])}
      if (opts.onlyif.file) {
        pfs.pReadFile(opts.onlyif.file)
        .done(function (onlyif_content) {
          onlyif_content_deferred.resolve({script: onlyif_content.toString()/*, args: opts.onlyif.args*/});
        });

      } else {
        throw 'onlyif object option(s) not supported';
      }

    } else if (typeof(opts.onlyif) === 'function') {
      var res = opts.onlyif(p2.facts);
      // expect boolean or promise on boolean
      if (Q.isPromise(res)) {
        res
        .done(function (rc) {
          onlyif_deferred.resolve([(rc ? 0 : -1), undefined, undefined]);
        });
      } else {
        onlyif_deferred.resolve([(res ? 0 : -1), undefined, undefined]);
      }

    } else {
      onlyif_content_deferred.resolve({script: opts.onlyif, args: ''});  // TODO support args on string method
    }

    onlyif_content_deferred.promise
    .done(function (onlyif_obj) {
      //console.log('***** onlyif_obj:', onlyif_obj);
      var cmd = onlyif_obj.script,
          args = onlyif_obj.args;
      utils.dlog('command running onlyif cmd:', cmd, 'args:', args);
      onlyif_deferred.resolve(
        utils.runCmd(
          cmd,
          {
            env: {
              ARGS: args
            }
          }
        )
      );
    });

  } else {
    // no onlyif, so allow continue
    onlyif_deferred.resolve([0, undefined, undefined]);
  }

  return onlyif_deferred.promise
  .then(function (onlyif_res) {
    utils.dlog('command: onlyif_res:', onlyif_res);
    var onlyif_rc = onlyif_res[0],
        onlyif_stdout = onlyif_res[1] || '',
        onlyif_stderr = onlyif_res[2] || '';

    if (onlyif_rc !== 0) {
      utils.vlog('command onlyif returned rc:', onlyif_rc, 'stdout:', onlyif_stdout, 'stderr:', onlyif_stderr);
    }
    return Q(onlyif_rc);

  });

};

module.exports = onlyif;
