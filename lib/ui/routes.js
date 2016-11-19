/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>

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
    fs = require('fs'),
    Q = require('q'),
    path = require('path'),
    utils = require('../../agent/lib/utils');

/**
 * Define UI routes
 * @constructor
 */
var routesUi = function (r, cfg, db, serverMetrics, app) {
  var self = this;
  console.log('in routesUi');

  r.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
  });

  var locals = {
    banner: utils.getBanner(),
    master_hostname: cfg.partout_master_hostname,
    master_api_port: cfg.partout_api_port,
    role: 'master'
  };

  r.get('/', function (req, res, next) {
    app.render('index.html', locals, function (err, rendereddata) {
      res.send(rendereddata);
    });
  });

  r.get('/app', app.isAuthenticated, function (req, res, next) {
    console.log('req:', req);
    locals.user = req.user;
    if (req.user.provider === 'github') {
      locals.user_avatarUrl = req.user._json.avatar_url;
    }
    app.render('app.html', locals, function (err, rendereddata) {
      res.send(rendereddata);
    });

  });

};

module.exports = routesUi;
