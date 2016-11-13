/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

var console = require('better-console'),
    Q = require('q'),
    cfg = new (require('./etc/partout.conf.js'))(),
    fs = require('fs'),
    u = require('util'),
    ca = new (require('./lib/ca'))(),

    express = require('express'),
    routerApi = express.Router(),
    httpsApi = require('https'),
    compression = require('compression'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    logger = morgan('combined'),
    db = new (require('./lib/db.js'))(cfg),
    serverMetrics = new (require('./lib/server_metrics'))();

Q.longStackSupport = true;

/**
 * Express app for the Master API
 * @class appApi
 * @memberof App
 */
var AppApi = function (opts, passport, controllers) {
  var self = this;

  self.app = express();
  var optionsApi = {
      key: fs.readFileSync(ca.masterApiPrivateKeyFile),
      cert: fs.readFileSync(ca.masterApiCertFile),
      ca: [
        fs.readFileSync(ca.agentSignerCertFile, 'utf8'),
        fs.readFileSync(ca.intCertFile, 'utf8'),
        fs.readFileSync(ca.rootCertFile, 'utf8')
        // cert to verify agents

        /*
         * root cert placed in /usr/share/ca-certificates/partout and updated
         * /etc/ca-certificates.conf to point to it.
         * run update-ca-certificates
         * only include intermediate ca here, and import this into
         * browsers cert stores
         */
        //fs.readFileSync(ca.rootCertFile)
      ],
      requestCert: true,
      rejectUnauthorized: false
    };

    self.app.opts = opts;

//        self.app.use(passport.initialize());
//        self.app.use(passport.authenticate('client-cert', {session: false}));

    self.app.use(compression());
    routerApi.use(logger);
    self.app.use(bodyParser.json({limit: '50mb'}));
    self.app.use(bodyParser.urlencoded({ extended: true }));

    require('./lib/api/routes')(routerApi, cfg, db.getDb(), controllers, serverMetrics);

    self.app.use('/', routerApi);
    self.app.use(express.static('public'));

    httpsApi.createServer(optionsApi, self.app)
    .listen(cfg.partout_api_port);
    console.info('Master API listening on port', cfg.partout_api_port);


};

module.exports = AppApi;
