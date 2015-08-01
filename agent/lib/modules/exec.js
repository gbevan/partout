/*jslint node: true, nomen: true */
'use strict';

/*********************************************************************
 * Exec module
 * ~~~~~~~~~~~
 *
 * p2.node([...])
 *   .exec('a command', options, function (err, stdout, stderr) { ... });
 *
 * Options (from https://nodejs.org/api/child_process.html):
 *
 *   - cwd String Current working directory of the child process
 *   - env Object Environment key-value pairs
 *   - encoding String (Default: 'utf8')
 *   - shell String Shell to execute the command with (Default: '/bin/sh'
 *     on UNIX, 'cmd.exe' on Windows, The shell should understand the
 *     -c switch on UNIX or /s /c on Windows. On Windows, command line
 *     parsing should be compatible with cmd.exe.)
 *   - timeout Number (Default: 0)
 *   - maxBuffer Number (Default: 200*1024)
 *   - killSignal String (Default: 'SIGTERM')
 *   - uid Number Sets the user identity of the process. (See setuid(2).)
 *   - gid Number Sets the group identity of the process. (See setgid(2).)
 *
 * also supports:
 *   - creates: 'file' - test file does not exist, otherwise skip.
 *   - returns: expected return code on error to be ignored.
 *
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

var _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  exec = require('child_process').exec;

var Exec = function (cmd, opts, cb) {
  var self = this;  // self is parents _impl

  if (!opts) {
    opts = {};
  }

  if (typeof (opts) === 'function') {
    cb = opts;
    opts = {};
  }

  _.each(self.nodes, function (node) {
    if (os.hostname() === node) {
      //console.log('Queing on node "' + node + '", cmd:', cmd);
      self._steps.push(function (callback) {
        console.log('Exec on node "' + node + '", cmd:', cmd, ', opts:', JSON.stringify(opts));

        function _exec(exists) {
          if (exists) {
            console.log('skipped');
            callback();

          } else {
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
              if (cb) {
                cb(err, stdout, stderr);
              }
              callback();
            });
          }
        }

        // handle 'extra' options
        if (opts.creates) {
          fs.exists(opts.creates, _exec);
          delete opts.creates;
        } else {
          _exec(false);
        }
      });
    }
  });
  return self;
};

module.exports = Exec;
