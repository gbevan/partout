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
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Q = require('q'),
    utils = require('../../utils'),
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
        facts = {};
    utils.dlog('in package winfeature facts()');

    // get installed packages for this OS from rpm.js
    self.getStatus()
    .done(function (packages) {
      facts.installed_winfeature_packages = packages;
      deferred.resolve(facts);
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

    utils.dlog('Package winfeature: in action ############################ name:', opts.name, 'ensure:', opts.ensure);

    // Get current status and version from rpm
    self.getStatus(opts.name)
    .then(function (current_state) {
      utils.dlog('Package winfeature: current_state:', current_state);
      console.log('Package winfeature: current_state:', current_state);

      // PRESENT / INSTALLED / LATEST
      if (opts.ensure.match(/^(present|installed|latest)$/)) {

        if (!current_state || current_state.status !== 'Enabled') { // not installed
          console.info('Installing winfeature package:', opts.name);

          utils.runPs(u.format('Enable-WindowsOptionalFeature -FeatureName "%s" -Online', opts.name))
          .done(function (res) {
            //console.log('new service res:', res);
            var rc = res[0],
                stdout = res[1],
                stderr = res[2];

            if (rc !== 0) {
              console.error('winfeature install failed:', stdout + '\n' + stderr);
            }
            if (command_complete_cb) command_complete_cb(rc, stdout, stderr);
            _impl.qEvent({
              module: 'package',
              object: opts.name,
              msg: 'install ' + (rc ? 'rc=' + rc : 'ok')
            });

            deferred.resolve({result: (rc ? 'failed' : 'changed')});
          });

        }

      } else if (opts.ensure.match(/^(absent|purged)$/)) {
        // ABSENT / PURGED

        if (current_state && current_state.status === 'Enabled') { // installed?y
          console.info('Removing package:', opts.name);

          utils.runPs(u.format('Disable-WindowsOptionalFeature -FeatureName "%s" -Online', opts.name))
          .done(function (res) {
            //console.log('new service res:', res);
            var rc = res[0],
                stdout = res[1],
                stderr = res[2];

            if (rc !== 0) {
              console.error('winfeature uninstall failed:', stdout + '\n' + stderr);
            }
            if (command_complete_cb) command_complete_cb(rc, stdout, stderr);
            _impl.qEvent({
              module: 'package',
              object: opts.name,
              msg: 'uninstall ' + (rc ? 'rc=' + rc : 'ok')
            });

            deferred.resolve({result: (rc ? 'failed' : 'changed')});
          });

        } else {
          deferred.resolve();
        }

      } else {
        console.error('package module does not support ensure option value of:', opts.ensure);
        deferred.resolve();
      }

    }) // current_state
    .done();

  }, {immediate: true}); // action

});

Package.prototype.getStatus = function (name) {
  var self = this,
      packages = {},
      deferred = Q.defer(),
      filter = (name ? u.format('-FeatureName "%s"', name) : '');
  utils.dlog('package winfeature getStatus entered');

  utils.runPs(u.format('Get-WindowsOptionalFeature -Online %s | ConvertTo-Json -compress', filter))
  .done(function (res) {
    var rc = res[0],
        stdout = res[1],
        stderr = res[2],
        json = (stdout ? JSON.parse(stdout) : false),
        services = {};

    if (!json) {
      deferred.resolve();
      return;
    }

    var res_array = (name ? [json] : json);

    res_array.forEach(function (s) {
      packages[s.FeatureName] = {
        'status': (s.State === 2 ? 'Enabled' : 'Disabled')
      };
    });

    var ret = (name ? packages[name] : packages);
    //console.log('package winfeature getStatus(' + name + ') resolves:', ret);
    deferred.resolve(ret);

  });

  return deferred.promise;
};


module.exports = Package;
