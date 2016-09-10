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
        packages = {};

    self.resolveNpm()
    .then(function (npm) {

      var cmd = u.format('%s --global ls -json', npm);
      //console.log('cmd:', cmd);

      // get installed npm packages

      var stdout = '',
          stderr = '',
          args = [
            '--global',
            'ls',
            '-json'
            ];

      //exec(cmd, function (err, stdout, stderr) {
      //var cp = exec(cmd, {maxBuffer: 2000 * 1024});
      //var cp = spawn(npm, args);
      utils.runCmd(cmd, {}, true)
      .done(function(cp) {

        cp.stdout.on('data', function (data) {
          stdout += data;
        });

        cp.stderr.on('data', function (data) {
          stderr += data;
        });

        cp.on('close', function (rc) {
          //utils.dlog('>>>>>>>>>>>>>>>>>>>>>>> rc:', rc);
          //console.log('>>>>>>>>>>>>>>>>>>>>>>> rc:', rc);
          //utils.dlog('>>>>>>>>>>>>>>>>>>>>>>> stderr:', stderr);
          //console.log('>>>>>>>>>>>>>>>>>>>>>>> stderr:', stderr);
          //utils.dlog('>>>>>>>>>>>>>>>>>>>>>>> stdout:', stdout);
          //console.log('>>>>>>>>>>>>>>>>>>>>>>> stdout:', stdout);

          if (rc === 0) {
            var npm = JSON.parse(stdout);
            //console.log('npm:', u.inspect(npm, {colors: true, depth: 5}));

            var deps = npm.dependencies;
            _.forEach(deps, function (value, key) {
              var p_obj = {
                name: key,
                version: value.version,
                from: value.from,
                resolved: value.resolved,
                provider: 'npm'
              };
              packages[key] = p_obj;
            });

            facts.installed_npm_packages = packages;
            //console.log('npm facts:', u.inspect(packages, {colors: true, depth: 5}));
          }

          deferred.resolve(facts);
        });

        cp.on('error', function (err) {
          console.log(u.format('spawn of `%s`:', cmd), err, stderr);
          deferred.resolve({});
        });
      }); // runCmd

    }); // resolveNpm

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

    utils.dlog('Package npm: in action ############################ name:', opts.name, 'ensure:', opts.ensure);

    // get current package status
    self.resolveNpm()
    .done(function (npm) {
      self.npm = npm;

      self.getStatus(opts.name)
      .done(function (details) {
        utils.dlog('Package npm ' + opts.name + ' current state details:', details);

        if (opts.ensure.match(/^(present|installed|latest)$/)) {

          if (!details) {
            console.info('Installing npm package:', opts.name);

            cmd = u.format('"%s" --global install %s', npm, opts.name);
            exec(cmd, function (err, stdout, stderr) {
              if (err) {
                console.error(u.format('exec of `%s`:', cmd), err, stderr);
              }
              if (stderr && stderr.length > 0) {
                console.warn(u.format('exec of `%s`: stderr: %s'), cmd, stderr);
              }

              _impl.qEvent({
                module: 'package',
                object: opts.name,
                msg: 'npm install ' + (err ? err : 'ok')
              });
              //deferred.resolve();
              deferred.resolve({result: (err ? 'failed' : 'changed')});
            }); // exec install

          } else if (opts.ensure === 'latest') {
            if (details.version !== details._candidate) {
              utils.dlog('Package npm latest version:', details.version, 'candidate:', details._candidate);
              console.info('Upgrading npm package:', opts.name);
              // get latest version
              cmd = u.format('"%s" --global update %s', npm, opts.name);
              exec(cmd, function (err, stdout, stderr) {
                if (err) {
                  console.error(u.format('exec of `%s`:', cmd), err, stderr);
                }
                if (stderr && stderr.length > 0) {
                  console.warn(u.format('exec of `%s`: stderr: %s'), cmd, stderr);
                }
                _impl.qEvent({
                  module: 'package',
                  object: opts.name,
                  msg: 'npm upgrade ' + (err ? err : 'ok')
                });
                deferred.resolve({result: (err ? 'failed' : 'changed')});
              });

            } else {
              deferred.resolve();
            }

          } else {
            deferred.resolve();
          } // if !installed/details

        } else if (opts.ensure.match(/^(absent|purged)$/)) {
        // ABSENT / PURGED
          if (details) {
            console.info('Removing npm package:', opts.name);

            cmd = u.format('"%s" --global uninstall %s', npm, opts.name);
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
                msg: 'npm uninstall ' + (err ? err : 'ok')
              });
              deferred.resolve({result: (err ? 'failed' : 'changed')});
            });

          } else {
            deferred.resolve();
          }

        } // if ensure

      });

    });

  }, {immediate: true}) // action

  ;
});

Package.prototype.resolveNpm = function () {
  var deferred = Q.defer(),
      npm = path.join(pfs.resolveNodeDir(), 'npm');
  //console.log('npm on node:', npm);

  pfs.pExists(npm)
  .done(function (exists) {
    //console.log('npm exists:', exists);
    if (!exists) {
      npm = 'npm';
    }
    //npm = utils.escapeBackSlash(npm);
    if (utils.isWin()) {
      npm = utils.winEscapeSpaces(npm);
    }
    //console.log('resolveNpm returning:', npm);
    deferred.resolve(npm);
  });

  return deferred.promise;
};

/**
 * Get NPM Package status
 * @param {string} name name of npm package
 */
Package.prototype.getStatus = function (name) {

  var self = this,
      deferred = Q.defer(),
      cmd = u.format('"%s" --global ls \'%s\' -json', self.npm, name);

  exec(cmd, function (err, stdout, stderr) {
    if (err) {
      utils.dlog(u.format('exec of `%s`:', cmd), err, stderr);
      if (err.code !== 1) {
        console.log(u.format('exec of `%s`:', cmd), err, stderr);
      }
      deferred.resolve();
    } else {
      var details = JSON.parse(stdout);
      utils.dlog('Package npm details #1:', details);

      if (!details) {
        deferred.resolve();
        return;
      }

      details = details.dependencies[name];

      // get latest version for upgrade candidate
      cmd = u.format('"%s" --global view \'%s\' version', self.npm, name);
      exec(cmd, function (err, stdout, stderr) {
        if (err) {
          if (err.code !== 1) {
            console.log(u.format('exec of `%s`:', cmd), err, stderr);
          }
          deferred.resolve(details);
        } else {
          details._candidate = stdout.trim();
          utils.dlog('Package npm details #2:', details);
          deferred.resolve(details);
        }
      });
    }
  });
  return deferred.promise;
};


module.exports = Package;
