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
var routesUi = function (r, cfg, db, serverMetrics, app, authHooks) {
  var self = this;
  console.log('in routesUi');

  r.get('/logout', function (req, res, next) {
    console.log('in logout');
    req.session.destroy(function(e){
      console.log('in logout after session destroy');
      req.logout();
      res.redirect('/');
    });
  });

//  var locals = {
//    banner: utils.getBanner(),
//    master_hostname: cfg.partout_master_hostname,
//    master_api_port: cfg.partout_api_port,
//    role: 'master'
//  };

  r.get('/', function (req, res, next) {
    console.log('/ req.authenticated:', req.authenticated);
    console.log('/ req.user:', req.user);
//    console.log('/ req:', req);
//    app.render('index.html', locals, function (err, rendereddata) {
    app.render('index.html', function (err, rendereddata) {
      res.send(rendereddata);
    });
  });

//  r.get('/login', function (req, res, next) {
//    console.log('/ req.isAuthenticated():', req.isAuthenticated());
//    console.log('/ req.user:', req.user);
//    app.render('login.html', locals, function (err, rendereddata) {
//      res.send(rendereddata);
//    });
//  });

//  r.get('/app'/*, app.isAuthenticated*/, function (req, res, next) {
//    console.log('/app app.settings:', app.settings);
//    console.log('/app req.user:', req.user);
//
////    locals.user = req.user.profile;
////    console.log('H1');
////    if (req.user.provider === 'github') {
////      locals.user_avatarUrl = req.user.profile._json.avatar_url;
////    }
//    console.log('H2');
//    app.render('app.html', locals, function (err, rendereddata) {
//      res.send(rendereddata);
//      console.log('H2.1');
//    });
//    console.log('H3');
//
//  });

  // DEPRECATED to views/
//  r.get('/app_template'/*, app.isAuthenticated*/, function (req, res, next) {
////    locals.user = req.user.profile;
////    if (req.user.provider === 'github') {
////      locals.user_avatarUrl = req.user.profile._json.avatar_url;
////    }
//    app.render('app_template.html', locals, function (err, rendereddata) {
//      res.send(rendereddata);
//    });
//
//  });

//  r.get('/p2table_template'/*, app.isAuthenticated*/, function (req, res, next) {
////    locals.user = req.user.profile;
////    if (req.user.provider === 'github') {
////      locals.user_avatarUrl = req.user.profile._json.avatar_url;
////    }
//    app.render('p2table_template.html', locals, function (err, rendereddata) {
//      res.send(rendereddata);
//    });
//
//  });

};

module.exports = routesUi;
