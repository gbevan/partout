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
    utils = new (require('../../utils'))(),
    u = require('util'),
    sysv = new (require('./sysv'))(),
    upstart = new (require('./upstart'))(),
    systemd = new (require('./systemd'))();

Q.longStackSupport = true;

Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/*
 * Debian provider for the Service module.
 */
var Service = P2M.Module(module.filename, function () {
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

    utils.dlog('service debian self:', self);
    self.getStatus()
    .done(function (services) {
      facts.services = services;
      deferred.resolve(facts);
    });

  })

  ///////////////
  // Run Action
  .action(function (args) {

    var self = this,
        deferred = args.deferred,
        //inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        command_complete_cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '',
        cmd = '';

    utils.dlog('Package yum: in action ############################ name:', opts.name, 'ensure:', opts.ensure);

    self.getStatus(opts.name)
    .done(function (status) {
      //console.log('service status:', status, 'opts.provider:', opts.provider);

      if (!status) {
        console.error('No status determined for service:', opts.name);
        deferred.resolve();
        return;
      }

      var deferred_enabled = Q.defer();

      if (opts.enabled) {
        if (status.desired !== 'start') {
          if (status.provider === 'sysv') {
            deferred_enabled.resolve(sysv.setEnabled(opts.name));

          } else if (status.provider === 'upstart') {
            deferred_enabled.resolve(upstart.setEnabled(opts.name));

          } else {
            console.error('Unsupported provider reported for debian service status:', status.provider);
            deferred_enabled.resolve();
          }
        } else {
          deferred_enabled.resolve();
        }

      } else { // disable
        if (status.desired !== 'stop') {
          if (status.provider === 'sysv') {
            deferred_enabled.resolve(sysv.setDisabled(opts.name));

          } else if (status.provider === 'upstart') {
            deferred_enabled.resolve(upstart.setDisabled(opts.name));

          } else {
            console.error('Unsupported provider reported for debian service status:', status.provider);
            deferred_enabled.resolve();
          }
        } else {
          deferred_enabled.resolve();
        }
      }

      deferred_enabled.promise
      .done(function () {

        if (opts.ensure === 'stopped') {
          if (status.actual === 'running') {
            cmd = 'service ' + opts.name + ' stop';
            utils.pExec(cmd)
            .fail(function (err) {
              console.error('Service command failed: ', cmd);
              console.error(err.stack);
//              utils.callbackEvent(next_step_callback, _impl.facts, {
//                module: 'service',
//                object: opts.name,
//                msg: 'service stop failed: ' + err
//              });
              _impl.qEvent({
                module: 'service',
                object: opts.name,
                msg: 'service stop failed: ' + err
              });
              deferred.resolve();
            })
            .done(function () {
//              utils.callbackEvent(next_step_callback, _impl.facts, {
//                module: 'service',
//                object: opts.name,
//                msg: 'stopped'
//              });
              _impl.qEvent({
                module: 'service',
                object: opts.name,
                msg: 'stopped'
              });
              deferred.resolve();
            });
          } else {
//            next_step_callback();
            deferred.resolve();
          }

        } else if (opts.ensure === 'running') {
          if (status.actual !== 'running') {
            cmd = 'service ' + opts.name + ' start';
            utils.pExec(cmd)
            .fail(function (err) {
              console.error('Service command failed: ', cmd);
//              utils.callbackEvent(next_step_callback, _impl.facts, {
//                module: 'service',
//                object: opts.name,
//                msg: 'service start failed: ' + err
//              });
              _impl.qEvent({
                module: 'service',
                object: opts.name,
                msg: 'service start failed: ' + err
              });
              deferred.resolve();
            })
            .done(function () {
//              utils.callbackEvent(next_step_callback, _impl.facts, {
//                module: 'service',
//                object: opts.name,
//                msg: 'started'
//              });
              _impl.qEvent({
                module: 'service',
                object: opts.name,
                msg: 'started'
              });
              deferred.resolve();
            });
          } else {
//            next_step_callback();
            deferred.resolve();
          }

        } else {
          console.error('ensure ' + opts.ensure + ' not supported');
//          next_step_callback(); // when finished
          deferred.resolve();
        }

      }); // deferred_enabled

    });


  }, {immediate: true}); // action

});

Service.prototype.getStatus = function (name) {
  var self = this,
      service = {},
      deferred = Q.defer();
  utils.dlog('service getStatus entered');

  Q.all([
    //upstart.getStatus(name),
    //sysv.getStatus(name)
    upstart.getStatus(name),
    sysv.getStatus(name)
    //TODO: systemd.getStatus(name)
  ])
  .done(function (res) {
    utils.dlog('service debian res:', res);
    var upstart = res[0],
        sysv = res[1];

    service = sysv;
    _.extend(service, upstart);

    //console.log('name:', name, 'status:', service);
    deferred.resolve(service);
  });
  return deferred.promise;
};

/**
 * get Facts for this module provider
 * @param {Object} facts_so_far Facts discovered up to calling this module
 * @return {Object} Promise
Service.getFacts = function (facts_so_far) {
  var self = this,
      facts = {},
      deferred = Q.defer();

  self.getStatus()
  .done(function (services) {
    facts.services = services;
    deferred.resolve(facts);
  });

  return deferred.promise;
};
 */

Service.runAction = function (_impl, next_step_callback, title, opts, command_complete_cb) {
  var self = this,
      cmd = '';

  //console.warn('IN RUNACTION Service Debian self:', self);



};

module.exports = Service;
