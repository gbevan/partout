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
    u = require('util');

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
  //.name('service')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var self = this,
        facts = {};

    utils.dlog('service windows self:', self);

    if (utils.pIsAdmin()) {
      self.getStatus()
      .done(function (services) {
        facts.services = services;
        deferred.resolve(facts);
      });

    } else {
      deferred.resolve(facts);
    }
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
        command_complete_cb = args.cb,
        result = {};

    utils.dlog('Service windows: in action ############################ name:', opts.name, 'ensure:', opts.ensure);

    self.getStatus(opts.name)
    .done(function (status) {
      //console.log('service status:', status);

      self.handleExec(opts, status)
      .then(function (res) {
        _.merge(result, res);
        return self.handleEnabled(opts, status);
      })
      .then(function (res) {
        _.merge(result, res);
        return self.handleEnsure(opts, status);
      })
      .then(function (res) {
        _.merge(result, res);
        deferred.resolve(result);
      })
      ;

    });

  }, {immediate: true}); // action

});

Service.prototype.getStatus = function (name) {
  var self = this,
      service = {},
      deferred = Q.defer(),
      filter = (name ? u.format('-Filter "Name=\'%s\'"', name) : '');
  utils.dlog('service getStatus entered');

  utils.runPs(u.format('Get-WmiObject -Class Win32_Service %s | ConvertTo-Json -compress', filter))
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

//    if (name) {
//      console.log('getStatus res_array:', res_array);
//    }

    res_array.forEach(function (s) {
      services[s.Name] = {
        'path': {
          'path': s.Path.Path,
          'relativePath': s.Path.RelativePath,
          'namespacePath': s.Path.NamespacePath
        },
        'pathName': s.PathName,
        'displayName': s.DisplayName,
        'actual': s.State,
        'status': s.Status,
        'startMode': s.StartMode,
        'startName': s.StartName
      };
    });

    deferred.resolve(services);

  });

  return deferred.promise;
};

Service.prototype.handleExec = function (opts, status) {
  var deferred = Q.defer();

  if (!opts.exec) {
    deferred.resolve();
    return deferred.promise;
  }
  if (status && status[opts.name]) {  // already exists
    deferred.resolve();
    return deferred.promise;
  }

  // Create new service
  utils.getPsVersion()
  .done(function (psVer) {
    //console.log('psVer:', psVer);

    if (psVer.PSVersion.Major < 3) {
      console.error('ERROR: Creating new services is only supported on Powershell >= 5.0');
      deferred.resolve();
      return;
    }

    // build New-Service command
    var nameP = '-Name ' + opts.name,
        execP = (opts.exec ? u.format('-BinaryPathName \'%s\'', opts.exec) : ''),
        descP = (opts.description ? u.format('-Description \'%s\'', opts.description) : ''),
        displayNameP = (opts.displayname ? u.format('-DisplayName \'%s\'', opts.displayname) : '');

    var regcmds =
        '$tPath = "C:\\partout_test";' +
        '$rPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\' + opts.name + '";' +
        '$rParamsPath = "$rPath\\Parameters";' +
        u.format('$AppDirectory = "%s";', opts.appdir) +
        u.format('$Application = "%s";', opts.application) +
        u.format('$AppParameters = "%s";', opts.appparams) +
        'if (!(Test-Path $rParamsPath)) { New-Item -Path $rParamsPath -Force; };' +
        'New-ItemProperty -Path $rParamsPath -Name "AppDirectory" -Value $AppDirectory -PropertyType STRING -Force;' +
        'New-ItemProperty -Path $rParamsPath -Name "Application" -Value $Application -PropertyType STRING -Force;' +
        'New-ItemProperty -Path $rParamsPath -Name "AppParameters" -Value $AppParameters -PropertyType STRING -Force;' ;

    var cmd = u.format(
      'New-Service %s %s %s %s -StartupType Disabled',
      nameP,
      execP,
      descP,
      displayNameP
    );

    cmd += '; ' + regcmds;

    //cmd = utils.winEscapeSpaces(cmd);

    //console.log('cmd:', utils.escapeBackSlash(cmd));
    console.log('cmd:', cmd);

    utils.runPs(cmd)
    .then(function (res) {
      //console.log('new service res:', res);
      var rc = res[0],
          stdout = res[1],
          stderr = res[2];
//      if (rc !== 0) {
//        console.log(stdout);
//        console.error(stderr);
//      }
      deferred.resolve({result: 'changed'});
    });

  });

  return deferred.promise;
};

Service.prototype.handleEnabled = function (opts, status) {
  var deferred = Q.defer();

  if (!opts.hasOwnProperty('enabled')) {
    deferred.resolve();
    return deferred.promise;
  }
  if (!status || !status[opts.name]) {  // exists?
    deferred.resolve();
    return deferred.promise;
  }

  utils.getPsVersion()
  .done(function (psVer) {
    //console.log('psVer:', psVer);

    if (psVer.PSVersion.Major < 3) {
      console.error('ERROR: Managing services is only supported on Powershell >= 3.0');
      deferred.resolve();
      return;
    }

    if (opts.enabled === 'Deleted') {
      utils.runPs(
        u.format('Set-Service -Name %s -Status "Stopped";', opts.name) +
        u.format('(Get-WmiObject -Class Win32_Service -Filter "Name=\'%s\'").delete()', opts.name)
      )
      .done(function (res) {
        //console.log('Deleted res:', res);
        deferred.resolve({result: 'changed'});
      });
      return;
    }

    // build New-Service command
    var nameP = '-Name ' + opts.name,
        startupP = '-StartupType "%s"';

    if (typeof(opts.enabled) === 'string') {
      startupP = u.format(startupP, opts.enabled);
    } else {
      if (opts.enabled === true) {
        startupP = u.format(startupP, 'Automatic');
      } else {
        startupP = u.format(startupP, 'Disabled');
      }
    }

    var cmd = u.format(
      'Set-Service %s %s',
      nameP,
      startupP
    );
    //cmd = utils.winEscapeSpaces(cmd);

    //console.log('cmd:', utils.escapeBackSlash(cmd));
    console.log('cmd:', cmd);

    utils.runPs(cmd)
    .then(function (res) {
      //console.log('service res:', res);
      var rc = res[0],
          stdout = res[1],
          stderr = res[2];
      deferred.resolve({result: 'changed'});
    });

  }); // PsVersion

  return deferred.promise;
};

Service.prototype.handleEnsure = function (opts, status) {
  var deferred = Q.defer();

  if (!opts.hasOwnProperty('ensure')) {
    deferred.resolve();
    return deferred.promise;
  }
  if (!status || !status[opts.name]) {  // exists?
    deferred.resolve();
    return deferred.promise;
  }

  utils.getPsVersion()
  .done(function (psVer) {
    //console.log('psVer:', psVer);

    if (psVer.PSVersion.Major < 3) {
      console.error('ERROR: Managing services is only supported on Powershell >= 3.0');
      deferred.resolve();
      return;
    }

    // build New-Service command
    var nameP = '-Name ' + opts.name,
        startupP = '-Status "%s"';

    if (typeof(opts.ensure) === 'string') {
      if (!opts.ensure.match(/(Running|Stopped)/)) {
        console.error('ERROR: Invalid option for ensure, must be either "Stopped" or "Running":', opts.ensure);
        deferred.resolve();
        return;
      }
      startupP = u.format(startupP, opts.ensure);

    } else {
      if (opts.ensure === true) {
        startupP = u.format(startupP, 'Running');
      } else {
        startupP = u.format(startupP, 'Stopped');
      }
    }

    var cmd = u.format(
      'Set-Service %s %s',
      nameP,
      startupP
    );
    //cmd = utils.winEscapeSpaces(cmd);

    //console.log('cmd:', utils.escapeBackSlash(cmd));
    console.log('cmd:', cmd);

    utils.runPs(cmd)
    .then(function (res) {
      //console.log('service res:', res);
      var rc = res[0],
          stdout = res[1],
          stderr = res[2];
      deferred.resolve({result: 'changed'});
    });

  }); // PsVersion

  return deferred.promise;
};


module.exports = Service;
