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
    //os = require('os'),
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
      gulp = path.join(pfs.resolveNodeDir(), 'gulp'),
      cmd = u.format('"%s" mocha', gulp);

  r.post('/mocha', function (req, res, next) {
    console.warn('REST /mocha called');

    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        console.log('exec: ' + cmd + ', err:', err, 'stderr', stderr, 'stdout:', stdout);
        res.send({
          err: err,
          stderr: stderr,
          stdout: stdout
        });

      } else {
        res.send({
          stdout: stdout
        });
      }
    });

  });

};

module.exports = routesApi;
