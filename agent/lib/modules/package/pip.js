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

var P2M = require('../../p2m'),
    console = require('better-console'),
    _ = require('lodash'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    path = require('path'),
    u = require('util'),
    pfs = new (require('../../pfs'))(),
    utils = require('../../utils'),
    os = require('os'),
    Q = require('q'),
    sArgv = require('string-argv');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

var Package = P2M.Module(module.filename, function () {
  var self = this;

  self

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var self = this,
        facts = {},
        packages = {},
        cmd = u.format('pip list');

    self.getStatus()
    .done(function (packages) {
      facts.installed_pip_packages = packages;
      deferred.resolve(facts);
    });

  }) // facts


  ///////////////
  // Run Action
  .action(function (args) {

    var deferred = args.deferred,
        //inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        cmd = '',
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '';

    utils.dlog('Package pip: in action ############################ name:', opts.name, 'ensure:', opts.ensure);

    // get current package status

    self.getStatus(opts.name)
    .done(function (details) {
      utils.dlog('Package pip ' + opts.name + ' current state details:', details);

      if (opts.ensure.match(/^(present|installed|latest)$/)) {

        if (!details) {
          console.info('Installing pip package:', opts.name);

          cmd = u.format('pip install %s', opts.name);
          exec(cmd, function (err, stdout, stderr) {
            if (err) {
              console.error(u.format('exec of `%s`:', cmd), err, stderr);
              deferred.reject(err);
              return;
            }
            if (stderr && stderr.length > 0) {
              console.warn(u.format('exec of `%s`: stderr: %s'), cmd, stderr);
            }

            _impl.qEvent({
              module: 'package',
              object: opts.name,
              msg: 'pip install ' + (err ? err : 'ok')
            });
            //deferred.resolve();
            deferred.resolve({result: (err ? 'failed' : 'changed')});
          }); // exec install

        //} else if (opts.ensure === 'latest') {

        } else {
          deferred.resolve();
        } // if !installed/details

      } else if (opts.ensure.match(/^(absent|purged)$/)) {
      // ABSENT / PURGED
        if (details) {
          console.info('Removing pip package:', opts.name);

          cmd = u.format('pip uninstall -y %s', opts.name);
          exec(cmd, function (err, stdout, stderr) {
            if (err) {
              console.error(u.format('exec of `%s`:', cmd), err);
            }
            if (stderr && stderr.length > 0) {
              console.warn(u.format('exec of `%s`: stderr: %s'), cmd, stderr);
            }
            _impl.qEvent({
              module: 'package',
              object: opts.name,
              msg: 'pip uninstall ' + (err ? err : 'ok')
            });
            deferred.resolve({result: (err ? 'failed' : 'changed')});
          });

        } else {
          deferred.resolve();
        }

      } // if ensure

    });


  }, {immediate: true}) // action

  ;
});

Package.prototype.parse_pip = function (pipout) {
  var packages = {},
      lines = pipout.split(/\r?\n/);

  _.forEach(lines, function (line) {
    line = line.trim();
    var m = line.match(/^(\w+) \((.*)\)/);

    if (m) {
      packages[m[1]] = {
        name: m[1],
        version: m[2],
        provider: 'pip'
      };
    }

  });

  return packages;
};

/**
 * Get PIP Package status
 * @param {string} name name of pip package
 */
Package.prototype.getStatus = function (name) {

  var deferred = Q.defer(),
      self = this,
      packages = {},
      cmd = u.format('pip list');

  // get installed pip packages

  var stdout = '',
      stderr = '';

  utils.runCmd(cmd, {}, true)
  .done(function(cp) {

    cp.stdout.on('data', function (data) {
      stdout += data;
    });

    cp.stderr.on('data', function (data) {
      stderr += data;
    });

    cp.on('close', function (rc) {
      if (rc === 0) {
        packages = self.parse_pip(stdout);
      }

      deferred.resolve((name ? packages[name] : packages));
    });

    cp.on('error', function (err) {
      console.log(u.format('spawn of `%s`:', cmd), err, stderr);
      deferred.resolve({});
    });
  }); // runCmd

  return deferred.promise;
};


module.exports = Package;
