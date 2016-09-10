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
    Mustache = require('mustache'),
    utils = require('../../agent/lib/utils');

/**
 * Define UI routes
 * @constructor
 */
var routesUi = function (r, cfg, db, controllers, serverMetrics) {
  var self = this;
  console.log('in routesUi');

  r.get('/', function (req, res, next) {
    console.log('in UI get /');
    Q.nfcall(fs.readFile, path.join(__dirname, '../../public/views/index.html'))
    .then(function (template) {
      var page = Mustache.render(
        template.toString(), {
          master_hostname: cfg.partout_master_hostname,
          master_api_port: cfg.partout_api_port,
          banner: utils.getBanner(),
          role: ''
        }
      );
      res.set('Content-Type', 'text/html');
      res.send(page);
      //res.sendFile(path.join(__dirname, '../../public/views/index.html'));
    })
    .fail(function (err) {
      console.error(err);
      res.status(500).send(err);
    })
    .done();
  });

};

module.exports = routesUi;
