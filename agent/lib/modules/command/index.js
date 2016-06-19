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

/*global p2*/
var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    Q = require('q'),
    utils = new (require('../../utils'))(),
    u = require('util'),
    pfs = new (require('../../pfs'))(),
    Mustache = require('mustache'),
    stringArgv = require('string-argv');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/**
 * @module Command
 *
 * @description
 * Command module
 * ==============
 *
 *     p2.node([...])
 *       .Command('a command', options, function (rc, stdout, stderr) { ... });
 *
 * Options (from https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options):
 *
 * See README.md for DSL documentation.
 *
 * ---
 * TODO: remaining support
 *   - command (override)
 *   - logoutput
 *   - refresh
 *   - refreshonly
 *   - tries
 *   - try_sleep
 *   - umask
 *   - unless
 */

var Command = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('command')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        Command: {
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

    cmd = Mustache.render(cmd, {
      title: title,
      opts: opts,
      f: p2.facts
    });

//    if (!opts.shell) {
//      opts.shell = true;
//    }

    utils.vlog('Command on node "' + os.hostname() + '", cmd:', cmd, ', opts:', JSON.stringify(opts));

//    var sp_args = stringArgv(cmd);
//    cmd = sp_args[0];
//    sp_args.shift();

    function set_watcher(inWatch) {
      utils.dlog('Command: inWatch:', inWatch, '_watch_state:', _watch_state, 'GLOBAL.p2_agent_opts.daemon:', GLOBAL.p2_agent_opts.daemon);
      if (/*!inWatch && */_watch_state && GLOBAL.p2_agent_opts.daemon) {
        console.log('>>> Command: Starting watcher on file:', opts.creates);
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
        console.log('Command: skipped due to target already exists (creates)');
        if (opts.creates) {
          set_watcher(inWatch);
        }
        cb('skipped');

      } else {
        var onlyif_deferred = Q.defer();
        if (opts.onlyif) {
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
          onlyif_deferred.resolve([0, undefined, undefined]);
        }

        onlyif_deferred.promise
        .then(function (onlyif_res) {
          utils.dlog('command: onlyif_res:', onlyif_res);
          var onlyif_rc = onlyif_res[0],
              onlyif_stdout = onlyif_res[1],
              onlyif_stderr = onlyif_res[2];

          if (onlyif_rc !== 0) {
            utils.vlog('command onlyif returned rc:', onlyif_rc, 'stdout:', onlyif_stdout, 'stderr:', onlyif_stderr);
            cb('skipped');
            return;
          }

          console.info(u.format('Spawning command: `%s`', cmd)/*, 'sp_args:', sp_args*/);
          utils.runCmd(cmd, opts)
          .fail(function (err) {
            console.error(u.format('spawn failed for command: `%s`', cmd), 'err:', err);
            throw err;
          })
          .done(function (res) {
            var rc = res[0],
                stdout = res[1],
                stderr = res[2];

            utils.dlog('command: rc:', rc, 'stdout:', stdout, 'stderr:', stderr);
            //console.log('command: rc:', rc, 'stdout:', stdout, 'stderr:', stderr);
            if (stderr) {
              console.error(stderr);
            }
            if (stdout) {
              console.log(stdout);
            }

            if (command_complete_cb) {
              command_complete_cb(rc, stdout, stderr);
            }

            var err2;
            if (opts.returns) {
              if (rc !== opts.returns) {
                cb('failed');

                // XXX: is it correct to throw an error here?
                err2 = new Error('Return code does not match expected by returns option');
                err2.code = rc;
                throw err2;
              }
            } else {
              if (rc !== 0) {
                cb('failed');

                // XXX: is it correct to throw an error here?
                err2 = new Error('None zero return code returned');
                err2.code = rc;
                throw err2;
              }
            }
            if (opts.creates) {
              set_watcher(inWatch);
            }
//            if (command_complete_cb) {
//              command_complete_cb(rc, stdout, stderr);
//            }
            cb('changed'); // next_step_callback or watcher callback
          });

        }); // onlyif_res

      }
    }

    // handle 'extra' options
    if (opts.creates) {
      fs.exists(opts.creates, function (exists) {
        _spawn(exists, false, function (result) {
          deferred.resolve({result: result});
        });
      });
      //delete opts.creates;
    } else {
      _spawn(false, false, function (result) {
        deferred.resolve({result: result});
      });
    }

  });

});

module.exports = Command;
