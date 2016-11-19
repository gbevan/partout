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

    httpsUi = require('https'),
    express = require('express'),
    expressSession = require('express-session'),
    flash = require('connect-flash'),
    compression = require('compression'),
//    passport = require('passport'),
    GitHubStrategy = require('passport-github2').Strategy,
    routerUi = express.Router(),
    morgan = require('morgan'),
    logger = morgan('combined'),
    db = new (require('./lib/db.js'))(cfg),
    serverMetrics = new (require('./lib/server_metrics'))(),
    _ = require('lodash'),

    bodyParser = require('body-parser'),
    feathers = require('feathers'),
    rest = require('feathers-rest'),
    socketio = require('feathers-socketio'),
    handler = require('feathers-errors/handler');

var Waterline = require('waterline'),
    arangodbAdaptor = require('sails-arangodb'),
    service = require('feathers-waterline'),
    ORM = new Waterline();

Q.longStackSupport = true;

/**
 * Express app for the Master UI
 * @class appUi
 * @memberof App
 */
var AppUi = function (opts, passport) {
  var self = this;

  self.waterline_config = {
    adapters: {
      'default': arangodbAdaptor,
      arangodb: arangodbAdaptor
    },
    connections: {
      arangodb: {
        adapter: 'arangodb',
        host: '127.0.0.1',
        port: 8529,
        user: 'root',
        password: 'Part2fly%25',
        database: 'partout'
      }
    },
    defaults: {}
  };

  // Schema
  self.w_Agent = Waterline.Collection.extend({
    identity: 'agents',
    schema: true,
    connection: 'arangodb',
    attributes: {

      env: {
        type: 'string'
      },

      facts: {
        type: 'object'
      },

      ip: {
        type: 'string'
      },

      certInfo: {
        type: 'object'
      },

      lastSeen: {
        type: 'date'
      }

    }
  });

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

  self.app.configure(rest());
  self.app.configure(socketio({
    //transports: ['websocket', 'polling']
  }));

  self.app.use(expressSession({ secret: 'SECRET'})); // TODO: move SECRET

  self.app.use('/public', express.static('public'));
  self.app.use('/dist', express.static('dist'));
  self.app.use('/node_modules', express.static('node_modules'));
  self.app.use('/systemjs.config.js', express.static('systemjs.config.js'));

  self.app.use(passport.initialize());
  self.app.use(passport.session());
  self.app.use(flash());

  passport.use(
    new GitHubStrategy(
      {
        clientID: cfg.GITHUB_CLIENT_ID,
        clientSecret: cfg.GITHUB_CLIENT_SECRET,
        callbackURL: 'https://192.168.0.64:11443/auth/github/callback'
      },
      function(accessToken, refreshToken, profile, done) {
//              User.findOrCreate({ githubId: profile.id }, function (err, user) {
//                return done(err, user);
//              });
        console.log('github profile:', profile);
        done(null, profile);
      }
    )
  );

  self.app.get(
    '/auth/github',
    passport.authenticate('github', { scope: [ 'user:email' ] })
  );

  self.app.get(
    '/auth/github/callback',
    passport.authenticate('github', {
      successRedirect: '/app',
      failureRedirect: '/',
      failureFlash: true

//          function(req, res) {
      // Successful authentication, redirect home.
//            res.redirect('/');
    })
  );

  self.app.isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.send(401);
    }
  }

  self.app.use(compression());
  routerUi.use(logger);
  self.app.use(bodyParser.json());
  self.app.use(bodyParser.urlencoded({ extended: true }));

  require('./lib/ui/routes')(routerUi, cfg, db.getDb(), serverMetrics, self.app);

  self.app.use('/', routerUi);
  self.app.use(express.static('public'));

  self.app.set('views', 'public/views');
  self.app.set('view engine', 'ejs');
  self.app.engine('html', require('ejs').renderFile);


  ///////////////////
  // FeathersJS

  ORM.loadCollection(self.w_Agent);
  ORM.initialize(self.waterline_config, function (err, data) {
    if (err) {
      console.error(err);
      throw new Error(err);
    }
    //console.log('w data:', data);

    self.app.use('/agents', self.app.isAuthenticated, service({
      Model: data.collections.agents,
      paginate: {
        default: 2,
        max: 4
      }
    }));

    var server = httpsUi.createServer(optionsUi, self.app)
    .listen(cfg.partout_ui_port);
    console.info('Master UI listening on port', cfg.partout_ui_port);

    var io = require('socket.io').listen(server);
  });

};

module.exports = AppUi;
