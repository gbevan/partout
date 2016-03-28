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

var Q = require('q'),
    u = require('util'),
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    console = require('better-console'),
    utils = new (require('./utils'))();

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/**
 * Provider constructor - to be inherited by other modules.
 * @constructor
 * @returns {object} n/a
 */
var Provider = function () {
  var self = this;
  return self;
};

/**
 * getProvider module spcecifc to operating system, os flavour or os type
 * @param   {object}  facts Discovered facts.
 * @returns {Promise} promise resolves to module loaded.
 */
Provider.prototype.getProvider = function (facts, filename) {
  var self = this;
  var deferred = Q.defer(),
      mydir = path.dirname(filename),
      srchJsList = [];
  //console.warn('getProvider mydir:', mydir);

  /*
   * only get a provider if filename is index.js (prevent infinite recursion)
   */
  if (!filename.match(/index\.js$/)) {
    deferred.resolve();
    return deferred.promise;
  }

  // use setProvider() method if provided in module's index.js
  if (!self.provider && self.setProvider && typeof(self.setProvider) === 'function') {
    var p = self.setProvider(facts);
    if (p) {
      self.provider = p;
    }
  }

  // Get some early facts for provider search
  //console.log('provider getProvider self.provider:', self.provider);
  if (self.provider) {
    srchJsList.push(self.provider);

  } else {
    // Provider search list
    // (1) Operating System Specific Provider?
    // (2) Operating System Family Provider?
    // (3) Operating System Type Provider?
    srchJsList = [facts.os_dist_id, facts.os_family, os.type().toLowerCase()];
  }

  utils.dlog('getProvider() srchJsList b4:', srchJsList);
  srchJsList = srchJsList.map(function (e) {
    if (!e) {
      return undefined;
    }
    return path.join(mydir, e.toLowerCase() + '.js');
  });
  srchJsList = srchJsList.filter(function (e) { return e !== undefined; });
  //console.log('srchJsList after:', srchJsList);

  var promises = [];
  srchJsList.forEach(function (js) {
    promises.push(function (js) {
      utils.dlog('check for provider:', js);
      var inner_deferred = Q.defer();
      fs.exists(js, function (exists) {
        if (exists) {
          var M = require(js),
              m = new M();
          utils.dlog('Provider m:', m);

          inner_deferred.resolve(m);  // was just M
        } else {
          inner_deferred.resolve();
        }
      });
      return inner_deferred.promise;
    }(js));
  });

  Q.all(promises)
  .done(function (arr_p) {
    utils.dlog('provider arr_p:', u.inspect(arr_p, {colors: true, depth: 3}));

    var M;
    arr_p.forEach(function (p) {
      //console.log('p:', p);
      if (!M && p) {
        M = p;
      }
    });
    if (M) {
      //console.log('getProvider resolving M:', M.runAction);
      deferred.resolve(M);
    } else {
      utils.vlog(
        (self.getName ? self.getName() : 'n/a') + ': Provider not found for this OS');
      deferred.resolve();
    }
  });

  return deferred.promise;
};



/**
 * runAction wrapper
 * @param {object}   _impl              DSL implementation
 * @param {function} next_step_callback Callback for next step in p2
 * @param {Array}    args               ???
 */
Provider.prototype._runAction = function (_impl, next_step_callback, inWatchFlag, title, opts, cb) {
  var self = this;
  utils.dlog('runAction filename:', self.moduleFileName);
  utils.dlog('provider runAction self:', self, 'stack:', (new Error().stack));

  self.getProvider(_impl.facts, self.moduleFileName)
  .then(function (PM) {
    utils.dlog('Provider runAction resolved PM:', PM);
    //console.warn('next_step_callback:', next_step_callback);
    if (PM) {
      //args.unshift(next_step_callback);
      //args.unshift(_impl);
      PM.runAction.call(self, _impl, next_step_callback, inWatchFlag, title, opts, cb);
    } else {
      next_step_callback();
    }
  })
  .done();
};

/**
 * _getFacts() wrapper for provided modules.
 * @param   {object}  facts_so_far Facts discovered so far by P2
 * @returns {Promise} Promise Resolves to facts discovered by this module.
 */
//Provider.prototype._getFacts = function (caller_filename, facts_so_far) {
Provider.prototype._getFacts = function (facts_so_far) {
  //console.warn('getFacts self:', this);
  //console.log('provider getFacts arguments:', arguments);

  var self = this,  // self is calling module
      deferred = Q.defer(),
      facts = {};

  utils.dlog('Provider _getFacts self.moduleFileName:', self.moduleFileName);

  var save_os_type = facts_so_far.os_type;

  self.getProvider(facts_so_far, self.moduleFileName)
  .then(function (PM) {
    utils.dlog('Provider PM:', PM);
    if (!PM) {
      deferred.resolve();
      return;
    }
    utils.dlog('Provider getFacts resolved PM (try 1):', PM);
    if (!save_os_type) {
      // Run again as the first one was (what?)
      self.getProvider(facts_so_far, self.moduleFileName)
      .then(function (PM) {
        utils.dlog('Provider getFacts resolved PM (try 2):', PM);
        deferred.resolve(PM.getFacts(facts_so_far));
      })
      .done();
    } else {
      deferred.resolve(PM.getFacts(facts_so_far));
    }
  })
  .done();

  return deferred.promise;
};

module.exports = Provider;
