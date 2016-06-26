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
    utils = new (require('../../utils'))(),
    assert = require('assert'),
    u = require('util');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/*
 * Apt provider for the Package module.
 *
 */
var Package = P2M.Module(module.filename, function () {
   var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  //.name('Facts')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var self = this,
        facts = {},
        packages = {},
        cmd = '';

    // get installed packages for this OS

    // Debian-like OS's
    exec('dpkg-query -l | tail -n +6', function (err, stdout, stderr) {
      if (err) {
        console.log('exec of dpkg -l failed:', err, stderr);
        deferred.resolve({});
      } else {
        //console.log('stdout:', stdout);
        var lines = stdout.split(/\r?\n/);
        _.forEach(lines, function (line) {
          line = line.trim();
          if (line === '') {
            return;
          }
          var fields = line.split(/\s+/, 4);
          //console.log('fields:', fields);
          var p_obj = {
            name: fields[1],
            version: fields[2],
            arch: fields[3],
            provider: 'apt'
          };
          //facts['package:' + fields[1]] = p_obj;
          packages[fields[1]] = p_obj;
        });
        facts.installed_packages = packages;

        deferred.resolve(facts);
      }
    });

  })

  ///////////////
  // Run Action
  .action(function (args) {

    var deferred = args.deferred,
        //inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '';

    utils.dlog('Package apt: in action ############################ name:', opts.name, 'ensure:', opts.ensure);
    //console.log('Package apt: in action ############################ name:', opts.name, 'ensure:', opts.ensure);

    // fix env for non-interactive apt commands
    process.env.DEBIAN_FRONTEND = "noninteractive";
    process.env.APT_LISTBUGS_FRONTEND = "none";
    process.env.APT_LISTCHANGES_FRONTEND = "none";

    Package.getStatus.call(self, opts.name)
    .then(function (current_state) {
      utils.dlog(opts.name, 'b4 ensure current_state:', current_state, 'ensure:', opts.ensure);
      // PRESENT / INSTALLED / LATEST
      if (opts.ensure.match(/^(present|installed|latest)$/)) {
        //console.log('ensure present');

        // TODO: version option needs more thought!!!


        if (!current_state || (opts.version && opts.version !== current_state.version)) {
          utils.dlog('current_state:', current_state);
          console.info('Installing package:', opts.name /*+ (opts.version ? u.format('=%s', opts.version) : '')*/);
//          exec(
//            'apt-get update && apt-get -q -y install --auto-remove ' + opts.name /*+ (opts.version ? u.format('=%s', opts.version) : '')*/,
//            {env: process.env},
//            function (err, stdout, stderr) {
//              console.log('stdout:', stdout, 'stderr:', stderr);
//              if (err) {
//                console.error('apt-get install failed:', err, stderr);
//              } else {
//                _impl.facts.installed_packages[opts.name] = {};  // next facts run will populate
//              }
//              if (command_complete_cb) command_complete_cb(err, stdout, stderr);
//
//              // TODO: EXTEND USAGE...
//  //            utils.callbackEvent(next_step_callback, _impl.facts, {
//  //              module: 'package',
//  //              object: opts.name,
//  //              msg: 'install ' + (err ? err : 'ok')
//  //            });
//              _impl.qEvent({
//                module: 'package',
//                object: opts.name,
//                msg: 'install ' + (err ? err : 'ok')
//              });
//              deferred.resolve();
//
//            }
//          );

          utils.runCmd(
            u.format('apt-get update && apt-get -q -y install --auto-remove %s', opts.name)
          )
          .fail(function (err) {
            _impl.qEvent({
              module: 'package',
              object: opts.name,
              msg: 'install failed err:' + err
            });
            deferred.resolve({result: 'failed'});
          })
          .done(function (res) {
            var rc = res[0],
                stdout = res[1],
                stderr = res[2];

            if (rc !== 0) {
              if (stdout) {
                console.log(stdout);
              }
              if (stderr) {
                console.error(stderr);
              }
              console.error(u.format('Install package %s failed', opts.name));
              _impl.qEvent({
                module: 'package',
                object: opts.name,
                msg: 'install failed rc:' + rc
              });
              deferred.resolve({result: 'failed'});
            } else {
              console.log(u.format('Install package %s ok', opts.name));
              _impl.facts.installed_packages[opts.name] = {};  // next facts run will populate
              _impl.qEvent({
                module: 'package',
                object: opts.name,
                msg: 'install ok'
              });
              deferred.resolve({result: 'changed'});
            }
          });

        } else if (opts.ensure === 'latest') {
          // LATEST
          if (current_state.version !== current_state.candidate) {
            console.info('Upgrading package:', opts.name);
            exec('apt-get upgrade -y ' + opts.name, function (err, stdout, stderr) {
              if (err) {
                console.error('apt-get upgrade failed:', err, stderr);
              }
              if (command_complete_cb) command_complete_cb(err, stdout, stderr);

//              utils.callbackEvent(next_step_callback, _impl.facts, {
//                module: 'package',
//                object: opts.name,
//                msg: 'upgrade ' + (err ? err : 'ok')
//              });

              _impl.qEvent({
                 module: 'package',
                object: opts.name,
                msg: 'upgrade ' + (err ? err : 'ok')
              });
              deferred.resolve({result: (err ? 'failed' : 'changed')});
            });
          } else {
            //next_step_callback();
            deferred.resolve();
          }

        } else {
//          next_step_callback();
          deferred.resolve();
        }

      } else if (opts.ensure.match(/^(absent|purged)$/)) {
        // ABSENT / PURGED
        //console.log('current_state:', current_state);

        if (current_state) {
          console.info('Removing package:', opts.name);

          exec(u.format('apt-get purge --auto-remove -y %s', opts.name), function (err, stdout, stderr) {
            if (err) {
              console.error('apt-get purge failed:', err, stderr);
            } else {
              delete _impl.facts.installed_packages[opts.name];
            }
            if (command_complete_cb) command_complete_cb(err, stdout, stderr);
//            utils.callbackEvent(next_step_callback, _impl.facts, {
//              module: 'package',
//              object: opts.name,
//              msg: 'uninstall ' + (err ? err : 'ok')
//            });
            _impl.qEvent({
              module: 'package',
              object: opts.name,
              msg: 'uninstall ' + (err ? err : 'ok')
            });
            deferred.resolve({result: (err ? 'failed' : 'changed')});
          });

        } else {
//          next_step_callback();
          deferred.resolve();
        }

      } else {
        console.error('package module does not support ensure option value of:', opts.ensure);
//        next_step_callback();
        deferred.resolve();
      }

    }) // current_state
    .fail(function (err) {
      console.error('in fail() err:', err);
      deferred.reject(err);
    })
    .done();

  }, {immediate: true});
});


Package.getStatus = function (name) {
  assert(name !== undefined);
  //assert(u.isString(name)); // wierd failure on raspbian/pi3
  assert(name !== '');

  var self = this,
      deferred = Q.defer(),
      cmd = 'apt-cache policy ' + name;
  utils.execToArray(cmd)
  .then(function (res) {
    var installed = '',
        candidate = '';
    res.outlines.forEach(function (line) {
      var m = line.match(/^\s*(Installed|Candidate):\s*(.*)$/);
      if (m) {
        if (m[1] === 'Installed') {
          installed = m[2].trim();

        } else if (m[1] === 'Candidate') {
          candidate = m[2].trim();
        }
      }
    });
    if (installed === '(none)') {
      deferred.resolve();

    } else if (installed === '') {
      deferred.reject(new Error('Unable to locate package'));

    } else {
      deferred.resolve({
        status: 'installed',
        version: installed,
        candidate: candidate
      });
    }
  })
  .fail(function (err) {
    deferred.reject(new Error('Unable to locate package'));
  })
  .done();

  return deferred.promise;
};


module.exports = Package;
