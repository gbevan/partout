/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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
    walk = require('walk'),
    path = require('path'),
    fs = require('fs'),
    crypto = require('crypto'),
    mkdirp = require('mkdirp'),
    Q = require('q'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    _ = require('lodash'),
    u = require('util'),
    os = require('os');

Q.longStackSupport = true;

/**
 * Common utils
 * @constructor
 */
var Utils = function () {
  var self = this;

  self.banner = "\n\
'########:::::'###::::'########::'########::'#######::'##::::'##:'########:\n\
 ##.... ##:::'## ##::: ##.... ##:... ##..::'##.... ##: ##:::: ##:... ##..::\n\
 ##:::: ##::'##:. ##:: ##:::: ##:::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ########::'##:::. ##: ########::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##.....::: #########: ##.. ##:::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##:::::::: ##.... ##: ##::. ##::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##:::::::: ##:::: ##: ##:::. ##:::: ##::::. #######::. #######::::: ##::::\n\
..:::::::::..:::::..::..:::::..:::::..::::::.......::::.......::::::..:::::\n\
";

};

Utils.prototype.print_banner = function () {
  var self = this;
  console.info(self.banner);
};

Utils.prototype.getBanner = function () {
  var self = this;
  return self.banner;
};

Utils.prototype.isWin = function () {
  return process.platform === 'win32';
};

Utils.prototype.isLinux = function () {
  return process.platform === 'linux';
};

/**
 * Syncronous function to read and parse /etc/os-release on linux os's
 * Used in unit-tests.
 * @returns {object} parsed contents of os-release as an object of key/value pairs
 */
Utils.prototype.get_linux_os_release_Sync = function () {
  var self = this;

  if (!self.isLinux()) {
    return;
  }

  var os_rel;
  try {
    os_rel = fs.readFileSync('/etc/os-release').toString();
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
    throw e;
  }

  if (!os_rel) {
    return;
  }

  var os_lines = os_rel.split(/\r?\n/),
      os_obj = {};
  os_lines.forEach(function (os_line) {
    var m = os_line.match(/^(\w+)="*?([^"]*)"*?/);
    if (m) {
      os_obj[m[1]] = m[2];
    }
  });

  return os_obj;
};

/**
 * Syncronous test for Debian OS.
 * Used in unit tests.
 * @returns {boolean} true if debian
 */
Utils.prototype.isDebianSync = function () {
  var self = this;

  var os_obj = self.get_linux_os_release_Sync();

  return os_obj.ID_LIKE === 'debian';
};

/**
 * Execute a shell command and return the results in an array of lines
 * @param {String}  cmd Command to run
 * @returns {Promise} with err, lines, stderr
 */
Utils.prototype.execToArray = function (cmd) {
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
Utils.prototype.pExec = function (cmd, options) {
  return Q.nfcall(exec, cmd, options);
};

/**
 * Promisified spawn
 * @param   {string}  cmd                     Command to execute
 * @param   {array}   args                    Arguments
 * @param   {object}  options                 Options for fs.spawn
 * @param   {boolean} resolve_to_childprocess promise resolves to async ChildProcess
 * @returns {object}  Promise (obj[0,1,2]=rc, stdout, stderr), rejects with error
 */
Utils.prototype.pSpawn = function (cmd, args, options, resolve_to_childprocess) {
  var self = this,
      deferred = Q.defer(),
      stdout = '',
      stderr = '';

  self.dlog('pSpawn: cmd:', cmd, 'args:', args, 'options:', options);
  //console.log('pSpawn: cmd:', cmd, 'args:', args, 'options:', options);
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

    if (rc !== 0 || signal !== null || stderr) {
      console.log('stdout:', stdout);
      console.error('stderr:', stderr);
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
 * @param   {string}  pscmd                   Shell command
 * @param   {object}  options                 Options passed to spawn
 * @param   {boolean} resolve_to_childprocess promise resolves to async ChildProcess
 * @returns {promise} promise (rc, stdout, stderr), rejects on spawn error
 */
Utils.prototype.runCmd = function (shellcmd, options, resolve_to_childprocess) {
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
    (self.isWin() ? 'cmd' : 'sh'),
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
Utils.prototype.runPs = function (pscmd, options, resolve_to_childprocess) {
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

/**
 * Get Powershell version
 * @returns {object} Object returned from $PSVersionTable e.g.: {PSVersion: {Major: 5, ...}, ...}
 */
Utils.prototype.getPsVersion = function () {
  var self = this,
      deferred = Q.defer();

  self.runPs('$PSVersionTable | ConvertTo-Json -compress')
  .done(function (res) {
    var rc = res[0],
        stdout = res[1],
        stderr = res[2],
        psVersion = (stdout ? JSON.parse(stdout) : {'PSVersion' : {'Major': -1}});
    deferred.resolve(psVersion);
  });

  return deferred.promise;
};

/**
 * Validate options object
 * @param   {string}  module    Module name
 * @param   {object}  opts      Options to be validated
 * @param   {object}  validopts Options to validate against
 * @returns {boolean} Options passed validation true/false
 */
Utils.prototype.vetOps = function (module, opts, validopts) {
  var ok = true;
  _.forEach(opts, function (v, k) {
    if (!validopts[k]) {
      var err = new Error('[' + module + '] Invalid option: ' + k);
      console.error(err);
      ok = false;
    }
  });
  return ok;
};

/**
 * Make a callback event object to be sent to the master
 * @param   {object} facts _impl.facts
 * @param   {object} o     {module:..., object:..., msg:...}
 * @returns {object} Populated callback object
 */
Utils.prototype.makeCallbackEvent = function (facts, o) {
  var self = this;
  self.dlog('DEPRECATED CALL to Utils.makeCallbackEvent() from:\nstack:\n' + (new Error()).stack);

  if (o) {
    return {
      agent_uuid: facts.partout_agent_uuid,
      hostname: facts.os_hostname,
      arch: facts.arch,
      platform: facts.platform,
      os_release: facts.os_release,
      os_family: facts.os_family,
      os_dist_name: facts.os_dist_name,
      os_dist_version_id: facts.os_dist_version_id,
      module: (o && o.module ? o.module : 'unknown'),
      object: (o && o.object ? o.object : 'unknown'),
      msg: (o && o.msg ? o.msg : 'Internal Agent Error> msg not provided to makeCallbackEvent() - stack:' + (new Error()).stack)
    };
  } else {
    return;
  }
};

/**
 * Module callback on completion of runAction() to continue to next step
 * @param {function} next_step_callback Next Step Callback in DSL
 * @param {object}   facts              _impl.facts
 * @param {object}   o                  Object with this event details: module:, object:, msg:.
 */
Utils.prototype.callbackEvent = function (next_step_callback, facts, o) {
  var self = this;
  if (o) {
    next_step_callback(self.makeCallbackEvent(facts, o));
  } else {
    next_step_callback();
  }
};

Utils.prototype.vlog = function () {
  var self = this;
  if (GLOBAL.partout.opts.verbose) {
    console.log('INFO:', u.format.apply(u, arguments));
  }
};

Utils.prototype.dlog = function () {
  var self = this;
  if (GLOBAL.partout.opts.debug) {
    console.log('DEBUG:', u.format.apply(u, arguments));
  }
};

/**
 * Start labelled timer, complete log the time taken by calling tloge(label).
 * @param {string} label Label for the timer
 */
Utils.prototype.tlogs = function (label) {
  var self = this;
  if (GLOBAL.partout.opts.timing) {
    console.time(label);
  }
};

/**
 * End labelled timer (see tlogs()).
 * @param {string} label Label for the timer
 */
Utils.prototype.tloge = function (label) {
  var self = this;
  if (GLOBAL.partout.opts.timing) {
    console.timeEnd(label);
  }
};

Utils.prototype.escapeBackSlash = function (s) {
  return s.replace(/\\/g, '\\\\');
};

Utils.prototype.winEscapeSpaces = function (s) {
  return s.replace(/ /g, '^ ');
};

Utils.prototype.pIsAdmin = function () {
  var self = this,
      deferred = Q.defer();

  if (os.platform() === 'win32') {
    self.pExec('NET SESSION')
    .fail(function (err) {
      //console.error('pIsAdmin() NET SESSION err:', err);
      deferred.resolve(false);
    })
    .done(function (res) {
      var stdout = res[0],
          stderr = res[1];

      //console.log('pIsAdmin() NET SESSION stdout:', stdout);
      //console.log('pIsAdmin() NET SESSION stderr:', stderr);

      deferred.resolve(stderr.length === 0);
    });

  } else {
    deferred.resolve((process.geteuid ? process.geteuid() : process.getuid()) === 0);
  }

  return deferred.promise;
};

module.exports = Utils;
