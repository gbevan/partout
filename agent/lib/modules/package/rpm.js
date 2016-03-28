/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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
    assert = require('assert'),
    utils = new (require('../../utils'))(),
    u = require('util');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

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
    utils.dlog('in package rpm facts()');
    //console.log('facts_so_far:', facts_so_far);

    // get installed packages for this OS

    // RedHat-like OS's
    cmd = "rpm -qa --queryformat '%{NAME} %{VERSION}-%{RELEASE} %{ARCH}\n'";
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        console.log('exec of ' + cmd + ' failed:', err, stderr);
        deferred.resolve({});
      } else {
        //console.log('stdout:', stdout);
        var lines = stdout.split(/\r?\n/);
        _.forEach(lines, function (line) {
          line = line.trim();
          if (line === '') {
            return;
          }

          var fields = line.split(/\s+/, 3);
          //console.log('fields:', fields);

          var p_obj = {
            name: fields[0],
            version: fields[1],
            arch: fields[2],
            provider: 'rpm'
          };
          packages[fields[0]] = p_obj;
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

    utils.dlog('Package rpm: in action TODO: ############################ name:', opts.name, 'ensure:', opts.ensure);

    // TODO:

    // PRESENT / INSTALLED / LATEST
    // TODO: Rewrite for RPM
    /*
    if (opts.ensure.match(/^(present|installed|latest)$/)) {
      console.log('ensure present');

      if (!_impl.facts.installed_packages[opts.name]) {

        exec('yum -y install -y ' + opts.name, function (err, stdout, stderr) {
          if (err) {
            console.error('yum install failed:', err, stderr);
          } else {
            _impl.facts.installed_packages[opts.name] = {};  // next facts run will populate
          }
          if (command_complete_cb) command_complete_cb(err, stdout, stderr);
          next_step_callback({
            module: 'package',
            object: opts.name,
            msg: 'install ' + (err ? err : 'ok')
          });
        });

      } else if (opts.ensure === 'latest') {
        // LATEST
        exec('yum -y update ' + opts.name, function (err, stdout, stderr) {
          if (err) {
            console.error('yum update failed:', err, stderr);
          }
          if (command_complete_cb) command_complete_cb(err, stdout, stderr);
          next_step_callback({
            module: 'package',
            object: opts.name,
            msg: 'upgrade ' + (err ? err : 'ok')
          });
        });
      }

    } else if (opts.ensure.match(/^(absent|purged)$/)) {
      // ABSENT / PURGED
      console.log('ensure absent pkg inst:', _impl.facts.installed_packages[opts.name]);

      if (_impl.facts.installed_packages[opts.name]) {

        exec('yum -y erase ' + opts.name, function (err, stdout, stderr) {
          if (err) {
            console.error('yum erase failed:', err, stderr);
          } else {
            delete _impl.facts.installed_packages[opts.name];
          }
          if (command_complete_cb) command_complete_cb(err, stdout, stderr);
          next_step_callback({
            module: 'package',
            object: opts.name,
            msg: 'uninstall ' + (err ? err : 'ok')
          });
        });

      } else {
        console.error('Unsupported option for package ensure:', opts.ensure);
        next_step_callback();
      }

    } else {
      console.error('package module does not support ensure option value of:', opts.ensure);
      next_step_callback();
    }
    */

    deferred.resolve();
  }, {immediate: true}); // action

});

/**
 * Get the current state of a package
 * @param   {String} name Name of package
 * @returns {Object} Undefined if not installed, otherwise {name:..., version:..., status:'installed'}
 */
Package.prototype.getStatus = function (name) {
  assert(name !== undefined);
  assert(u.isString(name));
  assert(name !== '');

  var self = this,
      deferred = Q.defer(),
      cmd = 'rpm -q --queryformat \'%{NAME} %{VERSION}-%{RELEASE}\' ' + name;

  exec(cmd, function (err, stdout, stderr) {
    if (err) {
      if (err.code !== 1) {
        console.error('exec of ' + cmd + ' failed:', err, stderr);
      }
      deferred.resolve();
    } else {
      var line = stdout.trim();
      if (line === '') {
        deferred.resolve();
      }

      var fields = line.split(/\s+/, 2);
      deferred.resolve({name: name, version: fields[1], status: 'installed'});
    }
  });

  return deferred.promise;
};


module.exports = Package;
