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

var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Q = require('q'),
    utils = new (require('../../utils'))();

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

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
 *   | cmd        | String | Title is taken as trhe command, otherwise, this argument can override it |
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

var Exec = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('exec')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        exec: {
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
        cmd = title;

    var _watch_state = (opts.watch ? true : _impl._watch_state);

    if (opts.cmd) {
      cmd = opts.cmd;
    }

    utils.vlog('Exec on node "' + os.hostname() + '", cmd:', cmd, ', opts:', JSON.stringify(opts));

    function set_watcher(inWatch) {
      utils.dlog('Exec: inWatch:', inWatch, '_watch_state:', _watch_state, 'GLOBAL.p2_agent_opts.daemon:', GLOBAL.p2_agent_opts.daemon);
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
              err = err2;
            }
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
        _exec(exists, false, function () {
          deferred.resolve();
        });
      });
      //delete opts.creates;
    } else {
      _exec(false, false, function () {
        deferred.resolve();
      });
    }

  });

});




module.exports = Exec;
