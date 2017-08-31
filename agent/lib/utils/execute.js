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

/*jslint node: true, nomen: true, vars: true*/
/*jshint multistr: true*/
'use strict';

var console = require('better-console'),
    u = require('util'),
    _ = require('lodash'),
    Q = require('q'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn;

/**
 * Execute utils
 *
 * @mixin
 */
var UtilsExecute = function () {

};

/**
 * Execute a shell command and return the results in an array of lines
 * @param {String}  cmd Command to run
 * @returns {Promise} with err, lines, stderr
 */
UtilsExecute.prototype.execToArray = function (cmd) {
  var deferred = Q.defer();

  exec(cmd, function (err, stdout, stderr) {
    //console.log('stderr:', stderr);
    //console.log('stdout:', stdout);

    if (err) {
      //deferred.reject(err);
      deferred.reject({
        cmd: cmd,
        outlines: [],
        stdout: stdout,
        stderr: stderr,
        err: err,
        rc: (err ? err.code : -1)
      });
      return;
    }

    var lines = stdout.split(/\r?\n/),
      ret_lines = [];

    _.forEach(lines, function (line) {
      line = line.trim();
      if (line !== '') {
        ret_lines.push(line);
      }
    });

    deferred.resolve({
      cmd: cmd,
      outlines: ret_lines,
      stdout: stdout,
      stderr: stderr,
      err: err,
      rc: (err ? err.code : 0)
    });
  });

  return deferred.promise;
};

/**
 * Promisified exec
 * @param   {string} cmd Command to execute
 * @param   {object} options Options for fs.exec
 * @returns {object} Promise (obj[0,1]=stdout, stderr), rejects with error
 */
UtilsExecute.prototype.pExec = function (cmd, options) {
  return Q.nfcall(exec, cmd, options);
};

/**
 * Promisified spawn
 * @param   {string}  cmd                     Command to execute
 * @param   {array}   args                    Arguments
 * @param   {object}  options                 Options for fs.spawn (note shell option not supported on node v4) - use wrapper method runCmd
 * @param   {boolean} resolve_to_childprocess promise resolves to async ChildProcess
 * @returns {object}  Promise (obj[0,1,2]=rc, stdout, stderr), rejects with error
 */
UtilsExecute.prototype.pSpawn = function (cmd, args, options, resolve_to_childprocess) {
  var self = this,
      deferred = Q.defer(),
      stdout = '',
      stderr = '';

  self.dlog('pSpawn: cmd:', cmd, 'args:', args, 'options:', options);
  var cp = spawn(cmd, args, options);

  resolve_to_childprocess = (resolve_to_childprocess ? resolve_to_childprocess : false);

  if (resolve_to_childprocess) {
    deferred.resolve(cp);
    return deferred.promise;
  }

  cp.on('error', function (err) {
    deferred.reject(err);
  });

  cp.stdout.on('data', function (d) {
    d = d.toString();
    //console.log(d);
    stdout += d;
  });

  cp.stderr.on('data', function (d) {
    d = d.toString();
    //console.warn(d);
    stderr += d;
  });

  /*
   * use exit as close is not guaranteed if spawning a daemon process
   */
  cp.on('exit', function (rc, signal) {
    self.dlog('pSpawn exit rc:', rc, 'signal:', signal);
    //console.log('pSpawn exit rc:', rc, 'signal:', signal);

    //if (rc !== 0 || signal !== null || stderr) {
    if (rc !== 0 || signal !== null) {
      //console.log('utils.runCmd:', cmd, args);
      //console.log('RC:', rc, 'signal:', signal);
      //console.log('stdout:', stdout);
//      console.error('Command:', cmd, args, 'failed with none zero return code');
//      if (stderr && stderr.trim() !== '') {
//        console.error(stderr);
//      }
//      console.error('utils.runCmd:', (new Error()).stack);
    }

    if (stdout || stderr) {
      deferred.resolve([rc, stdout, stderr]);
    }
  });

  cp.on('close', function (rc) {
    self.dlog('pSpawn close');
    //console.log('pSpawn close rc:', rc);
    //console.log('stdout:', stdout);
    //console.error('stderr:', stderr);
    deferred.resolve([rc, stdout, stderr]);
  });

  return deferred.promise;
};

/**
 * Run shell command (cmd or sh), uses spawn instead of exec
 * @param   {string}  shellcmd                Shell command
 * @param   {object}  options                 Options passed to spawn
 * @param   {boolean} resolve_to_childprocess promise resolves to async ChildProcess
 * @returns {promise} promise (rc, stdout, stderr), rejects on spawn error
 */
UtilsExecute.prototype.runCmd = function (shellcmd, options, resolve_to_childprocess) {
  var self = this;

  options = (options ? options : {});
  //options.shell = false; // force to false

  var args = [];
  if (self.isWin()) {
    args = ['/s', '/c'];
  } else {
    args = ['-c'];
  }
  args.push(shellcmd);

  return self.pSpawn(
    (self.isWin() ? 'cmd.exe' : '/bin/sh'),
    args,
    options,
    resolve_to_childprocess
  );
};

/**
 * Run Powershell on windows host
 * @param   {string}  pscmd                   Powershell command
 * @param   {object}  options                 Options passed to spawn
 * @param   {boolean} resolve_to_childprocess promise resolves to async ChildProcess
 * @returns {promise} promise (rc, stdout, stderr), rejects on spawn error
 */
UtilsExecute.prototype.runPs = function (pscmd, options, resolve_to_childprocess) {
  var self = this;

  options = (options ? options : {});
  options.shell = false; // force to false

  return self.pSpawn(
    'powershell.exe',
    [
      '-ExecutionPolicy',
      'Bypass',
      '-command',
      pscmd
    ],
    options,
    resolve_to_childprocess
  );
};



module.exports = UtilsExecute;
