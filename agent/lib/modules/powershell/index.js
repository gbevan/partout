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
    spawn = require('child_process').spawn,
    Q = require('q'),
    utils = new (require('../../utils'))(),
    stringArgv = require('string-argv');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/**
 * @module Powershell
 *
 * @description
 * Powershell module
 * ============
 *
 *     p2.node([...])
 *       .powershell('a powershell', options, function (rc, stdout, stderr) { ... });
 *
 * Options (from https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options):
 *
 * | Operand    | Type   | Description                                                |
 * |:-----------|--------|:-----------------------------------------------------------|
 * | cmd        | String | Title is taken as the powershell, otherwise, this argument can override it |
 * | cwd        | String | Current working directory of the child process |
 * | env        | Object | Environment key-value pairs |
 * | uid        | Number | Sets the user identity of the process. (See setuid(2).) |
 * | gid        | Number | Sets the group identity of the process. (See setgid(2).) |
 *
 * will support:
 * - creates: 'file' - test file does not exist, otherwise skip.
 * - returns: expected return code on error to be ignored.
 *
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

var Powershell = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('powershell')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        powershell: {
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

//    if (!opts.shell) {
//      opts.shell = true;
//    }

    utils.vlog('Powershell on node "' + os.hostname() + '", cmd:', cmd, ', opts:', JSON.stringify(opts));

//    var sp_args = stringArgv(cmd);
//    cmd = sp_args[0];
//    sp_args.shift();

    function set_watcher(inWatch) {
      utils.dlog('Powershell: inWatch:', inWatch, '_watch_state:', _watch_state, 'GLOBAL.p2_agent_opts.daemon:', GLOBAL.p2_agent_opts.daemon);
      if (/*!inWatch && */_watch_state && GLOBAL.p2_agent_opts.daemon) {
        console.log('>>> Powershell: Starting watcher on file:', opts.creates);
        _impl.P2_unwatch(opts.creates);
        _impl.P2_watch(opts.creates, function (watcher_cb) {
          console.log('watcher triggered. file:', opts.creates, 'this:', this);

          fs.exists(opts.creates, function (exists) {
            _spawn(exists, true, watcher_cb);
          });
        });
      }
    }

    function _spawn(exists, inWatch, cb) {
      if (exists) {
        console.log('Powershell: skipped due to target already exists (creates)');
        if (opts.creates) {
          set_watcher(inWatch);
        }
        cb();

      } else {
        console.log('Spawning powershell:', cmd/*, 'sp_args:', sp_args*/);
        utils.runPs(cmd, opts)
        .fail(function (err) {
          console.error('spawn powershell failed for command:', cmd, 'err:', err);
          throw err;
        })
        .done(function (res) {
          var rc = res[0],
              stdout = res[1],
              stderr = res[2];

          utils.dlog('rc:', rc, 'stdout:', stdout, 'stderr:', stderr);
          if (stderr) {
            console.error(stderr);
          }
          if (stdout) {
            console.log(stdout);
          }
          if (opts.returns) {
            if (rc !== opts.returns) {
              var err2 = new Error('Return code does not match expected by returns option');
              err2.code = rc;
              throw err2;
            }
          }
          if (opts.creates) {
            set_watcher(inWatch);
          }
          if (command_complete_cb) {
            command_complete_cb(rc, stdout, stderr);
          }
          if (opts.creates) {
            cb({
              module: 'powershell',
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
        _spawn(exists, false, function () {
          deferred.resolve();
        });
      });
      //delete opts.creates;
    } else {
      _spawn(false, false, function () {
        deferred.resolve();
      });
    }

  });

});

module.exports = Powershell;
