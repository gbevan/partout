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

/*jslint node: true, vars: true*/
'use strict';

var console = require('better-console'),
    //fs = require('fs'),
    //path = require('path'),
    //pfs = new (require('../../agent/lib/pfs'))(),
    //Mustache = require('mustache'),
    //Q = require('q'),
    express = require('express'),
    os = require('os'),
    exec = require('child_process').exec,
    path = require('path'),
    utils = new (require('../utils'))(),
    pfs = new (require('../pfs'))(),
    u = require('util');

//Q.longStackSupport = true;
//Q.onerror = function (err) {
//  console.error(err);
//  console.error(err.stack);
//};

/**
 * Define RESTful API routes
 * @constructor
 *
 */
// FIXME: restrict to authorised master (via ssl cert)
var routesApi = function (r, cfg, db, controllers, serverMetrics) {
  var self = this,
      nodegulp = path.join(pfs.resolveNodeDir(), 'gulp'),
      mochaTimeRe = /Finished .* after ([\d\.]+) (ms|s|min)$/m;

  /**
   * Middleware: Validate a master request is authorised
   * @param {object}   req  Request
   * @param {object}   res  Result
   * @param {function} next Callback
   */
  function requestMasterCertAuthorized (req, res, next) {
    //console.log('r.mock:', r.mock);
    //console.log('req.client:', req.client);
    console.log('requestClientCertAuthorized req.client authorized:', req.client.authorized);
    if (!req.client.authorized && !r.mock) {
      console.error('Error: Unauthorised request', req.client.authorizationError);
      res
      .status(401)
      .send({
        err: true,
        stdout: 'Master SSL cert denied: ' + req.client.authorizationError + '\n\r'
      });
      return;
    }
    next();
  }

  r.post('/mocha', requestMasterCertAuthorized, function (req, res, next) {
    console.warn('REST /mocha called');

    pfs.pExists(nodegulp)
    .done(function (exists) {
      var gulp = (exists ? nodegulp : 'gulp'),
          cmd = u.format('%s mocha', gulp);

      console.warn('running cmd:', cmd);
      exec(cmd, function (err, stdout, stderr) {
        if (err) {
          console.error(err, stderr);
        }
        var time_taken = -1;
        if (stdout) {
          var r = stdout.match(mochaTimeRe);
          if (r) {
            console.log('r:', r);
            time_taken = parseFloat(r[1]);
            if (r[2] === 's') {
              time_taken *= 1000; // convert to ms
            } else if (r[2] === 'min') {
              time_taken *= 60 * 1000;
            }
          } else {
            console.log('REGEX NOT MATCH Time taken stdout:\n', stdout);
          }
        }
        //console.log('FACTS:', GLOBAL.p2.facts);
        var os_name = 'unknown';
        if (GLOBAL.p2.facts.os_dist_pretty_name) {
          os_name = GLOBAL.p2.facts.os_dist_pretty_name;
        } else {
          if (GLOBAL.p2.facts.os_family) {
            os_name = GLOBAL.p2.facts.os_family;

            if (GLOBAL.p2.facts.os_release) {
              os_name += ' ' + GLOBAL.p2.facts.os_release;
            }
          }
        }
        var resobj = {
          platform: os.platform(),
          release: os.release(),
          type: os.type(),
          arch: os.arch(),
          os: os_name,
          hostname: os.hostname(),
          err: err,
          stderr: stderr,
          stdout: stdout,
          time_taken: time_taken
        };
        res.send(resobj);
      });
    });

  });

};

module.exports = routesApi;
