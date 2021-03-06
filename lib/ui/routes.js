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
var routesUi = function (r, cfg, serverMetrics, app, authHooks) {
  var self = this;

  r.get('/logout', function (req, res, next) {
    console.log('in logout');
    req.session.destroy(function(e){
      console.log('in logout after session destroy');
      req.logout();
      res.redirect('/');
    });
  });

  r.get('/', function (req, res, next) {
    app.render('index.html', function (err, rendereddata) {
      res.send(rendereddata);
    });
  });

};

module.exports = routesUi;
