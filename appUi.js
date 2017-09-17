/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2017  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

const console = require('better-console'),
      Q = require('q'),
      cfg = new (require('./etc/partout.conf.js'))(),
      fs = require('fs'),
      u = require('util'),
      ca = new (require('./lib/ca'))(),
      utils = require('./agent/lib/utils'),
      Issues = require('./lib/issues'),

      httpsUi = require('https'),
      express = require('express'),
//      expressSession = require('express-session'),
//      ArangoDBStore = require('connect-arangodb-session')(expressSession),
      flash = require('connect-flash'),
      compression = require('compression'),
      GitHubStrategy = require('passport-github2').Strategy,
      GithubTokenStrategy = require('passport-github-token'),
      cookieParser = require('cookie-parser'),
      routerUi = express.Router(),
      morgan = require('morgan'),
      logger = morgan('UI :: :method :url :status :response-time ms - :res[content-length] bytes'),
      passport = require('passport'),
      serverMetrics = new (require('./lib/server_metrics'))(),
      _ = require('lodash'),

      bodyParser = require('body-parser'),
      feathers = require('feathers'),
      staticServe = require('feathers').static,
      cors = require('cors'),
      rest = require('feathers-rest'),
      socketio = require('feathers-socketio'),
      errorHandler = require('feathers-errors/handler'),
      hooks = require('feathers-hooks'),
      jwt = require('feathers-authentication-jwt'),
      local = require('feathers-authentication-local'),
      auth = require('feathers-authentication'),
      services = require('./server/services');

const debug = require('debug').debug('partout:appUi');

Q.longStackSupport = true;

/**
 * Express app for the Master UI
 * @class appUi
 * @memberof App
 */
var AppUi = function () { };

AppUi.prototype.init = function (opts) {
  var self = this;
  return new Promise((resolve, reject) => {
    debug('in AppUi init() async');

  //  self.services = services;

    self.app = feathers();
    var optionsUi = {
        key: fs.readFileSync(ca.masterUiPrivateKeyFile),
        cert: fs.readFileSync(ca.masterUiCertFile),
        ca: [
          fs.readFileSync(ca.intCertFile)

          /*
           * root cert placed in /usr/share/ca-certificates/partout and updated
           * /etc/ca-certificates.conf to point to it.
           * run update-ca-certificates
           * only include intermediate ca here, and import this into
           * browsers cert stores
           */
        ],
        requestCert: true,
        rejectUnauthorized: false
      };

    self.app.opts = opts;
    self.app.set('cfg', cfg);

    /*
    var store = new ArangoDBStore({
      url: cfg.database_url,
      dbName: cfg.database_name
    });

    store.on('error', function (err) {
      if (err) {
        throw new Error(err);
      }
    });
    */

    self.app
    .use(compression())
    .use(cors())
    .use(logger)
    .use('/', staticServe('public'))  // assets
    .use('/dist', staticServe('dist'))
    .use('/node_modules', staticServe('node_modules'))
    .use(flash())
    .configure(hooks())
    .configure(rest())
    .configure(socketio(function (io) {

      io.on('connection', function (socket) {
        debug('socket connection recvd');

        socket.on('login', function(entity, info) {
          debug('(Socket) User logged in', entity);
          debug('(Socket) user:', socket.user);
        });

        socket.on('logout', function(tokenPayload, info) {
          debug('(Socket) User logged out', tokenPayload);
        });
      });

      io.use(function (socket, next) {
        //console.log('socket event:', socket);
        next();
      });
    }))
    .configure(services(function (err, orm) {
      debug('services cb');

      // Create issue reporter for collection into db/ui
      const issues = new Issues(self.app);
      self.report_issue = self.app.report_issue = issues.report_issue.bind(issues);

      self.app
      //.use(express.static('public')); // /assets, /css. etc
      .use(bodyParser.json())
      .use(bodyParser.urlencoded({ extended: true }))
      .set('query parser', 'extended')
      .use(cookieParser());
      debug('after app configures');

      self.app.use('/', routerUi);

      require('./lib/ui/routes')(routerUi, cfg, serverMetrics, self.app, auth.hooks);

      self.app.set('views', 'public/views');
      self.app.set('view engine', 'ejs');

      // Template variables
      self.app.locals = {
        banner: utils.getBanner(),
        master_hostname: cfg.partout_master_hostname,
        master_api_port: cfg.partout_api_port,
        role: 'master'
      };
      self.app.engine('html', require('ejs').renderFile);

//      self.app.use(function (req, res, next) {
//        console.log('IN MY FUNC');
//        next(new Error('TEST errorHandler'));
//      });

      self.app.use(errorHandler({
        html: function (error, req, res, next) {
          console.error('errorHandler html error:', error);
          self.app.report_issue(error);
          next();
        }
      }));

      ///////////////////////////////////////////

      self.app.on('login', function(entity, info) {
        debug('(Rest) User logged in', entity);
      });
      self.app.on('logout', function(tokenPayload, info) {
        debug('(Rest) User logged out', tokenPayload);
      });

      var server = httpsUi.createServer(optionsUi, self.app)
      .listen(cfg.partout_ui_port);
      console.info('Master UI listening on port', cfg.partout_ui_port);

      var io = require('socket.io').listen(server);

      self.app.setup(server);
      resolve();
    }));

  });
};

module.exports = AppUi;
