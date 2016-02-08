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

var console = require('better-console'),
  _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  exec = require('child_process').exec,
  Q = require('q');

/**
 * @module Exec
 *
 * @description
 * Exec module
 * ===========
 *
 *     p2.node([...])
 *       .exec('a command', options, function (err, stdout, stderr) { ... });
 *
 * Options (from https://nodejs.org/api/child_process.html):
 *
 *   | Operand    | Type   | Description                                                |
 *   |:-----------|--------|:-----------------------------------------------------------|
 *   | cwd        | String | Current working directory of the child process |
 *   | env        | Object | Environment key-value pairs |
 *   | encoding   | String | (Default: 'utf8') |
 *   | shell      | String | Shell to execute the command with (Default: '/bin/sh'
 *   |            |        | on UNIX, 'cmd.exe' on Windows, The shell should understand |
 *   |            |        | the -c switch on UNIX or /s /c on Windows. On Windows, |
 *   |            |        | command line parsing should be compatible with cmd.exe.) |
 *   | timeout    | Number | (Default: 0) |
 *   | maxBuffer  | Number | (Default: 200*1024) |
 *   | killSignal | String | (Default: 'SIGTERM') |
 *   | uid        | Number | Sets the user identity of the process. (See setuid(2).) |
 *   | gid        | Number | Sets the group identity of the process. (See setgid(2).) |
 * ---
 * also supports:
 *   - creates: 'file' - test file does not exist, otherwise skip.
 *   - returns: expected return code on error to be ignored.
 * ---
 * TODO: remaining support
 *   - command (override)
 *   - logoutput
 *   - onlyif
 *   - refresh
 *   - refreshonly
 *   - tries
 *   - try_sleep
 *   - umask
 *   - unless
 */

var Exec = function () {
  var self = this;
  //console.log('Exec called self:', self);
};

Exec.prototype.addStep = function (_impl, cmd, opts, command_complete_cb) {
  var self = this;
  var _watch_state = self._watch_state;

  if (!opts) {
    opts = {};
  }

  if (typeof (opts) === 'function') {
    command_complete_cb = opts;
    opts = {};
  }

  if (!_impl.ifNode()) {
    return self;
  }

  //console.log('Queing on node "' + node + '", cmd:', cmd);
  _impl.push_action(function (next_step_callback) {

    console.log('Exec on node "' + os.hostname() + '", cmd:', cmd, ', opts:', JSON.stringify(opts));

    function set_watcher(inWatch) {
      console.log('Exec: inWatch:', inWatch, '_watch_state:', _watch_state, 'GLOBAL.p2_agent_opts.daemon:', GLOBAL.p2_agent_opts.daemon);
      if (/*!inWatch && */_watch_state && GLOBAL.p2_agent_opts.daemon) {
        console.log('>>> Exec: Starting watcher on file:', opts.creates);
        _impl.P2_unwatch(opts.creates);
        _impl.P2_watch(opts.creates, function (watcher_cb) {
          console.log('watcher triggered. file:', opts.creates, 'this:', this);

          fs.exists(opts.creates, function (exists) {
            _exec(exists, true, watcher_cb);
          });
        });
      }
    }

    function _exec(exists, inWatch, cb) {
      if (exists) {
        console.log('Exec: skipped due to target already exists (creates)');
        if (opts.creates) {
          set_watcher(inWatch);
        }
        cb();

      } else {
        console.log('Executing command:', cmd);
        exec(cmd, opts, function (err, stdout, stderr) {
          if (stderr) {
            console.error(stderr);
          }
          if (stdout) {
            console.log(stdout);
          }
          if (err === null) {
            err = new Error();
            err.code = 0;
          }
          if (opts.returns) {
            if (err.code !== opts.returns) {
              var err2 = new Error('Return code does not match expected by returns option');
              err2.code = err.code;
              throw err2;
            }
          } else if (err && err.code !== 0) {
            throw err;
          }
          if (opts.creates) {
            set_watcher(inWatch);
          }
          if (command_complete_cb) {
            command_complete_cb(err, stdout, stderr);
          }
          if (opts.creates) {
            cb({
              module: 'exec',
              object: opts.creates,
              msg: 'target (re)created'
            }); // next_step_callback or watcher callback
          } else {
            cb(); // next_step_callback or watcher callback
          }
        });
      }
    }

    // handle 'extra' options
    if (opts.creates) {
      fs.exists(opts.creates, function (exists) {
        _exec(exists, false, next_step_callback);
      });
      //delete opts.creates;
    } else {
      _exec(false, false, next_step_callback);
    }

  }); // push
  //return self;
};

/**
 * Return this module's name
 * @return {String} name of module
 */
Exec.getName = function () { return 'exec'; };

/**
 * Return this module's discovered facts
 * @return {String} name of module or a deferred promise
 */
Exec.prototype.getFacts = function () {
  var facts = {},
    deferred = Q.defer();

  facts.exec_loaded = true;
  //facts.THIS_IS_WORKING = true;
  deferred.resolve(facts);

  return deferred.promise;
};

module.exports = Exec;
