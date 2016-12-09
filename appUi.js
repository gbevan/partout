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
    utils = require('./agent/lib/utils'),

    httpsUi = require('https'),
    express = require('express'),
    expressSession = require('express-session'),
    ArangoDBStore = require('connect-arangodb-session')(expressSession),
    flash = require('connect-flash'),
    compression = require('compression'),
    GitHubStrategy = require('passport-github2').Strategy,
    GithubTokenStrategy = require('passport-github-token'),
    cookieParser = require('cookie-parser'),
    routerUi = express.Router(),
    morgan = require('morgan'),
    logger = morgan('UI :: :method :url :status :response-time ms - :res[content-length] bytes'),
    passport = require('passport'),
    db = new (require('./lib/db.js'))(cfg),
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
    auth = require('feathers-authentication');
//    authHooks = require('feathers-authentication').hooks,
//    jwt = require('jsonwebtoken')

var Waterline = require('waterline'),
    arangodbAdaptor = require('sails-arangodb'),
    service = require('feathers-waterline'),
    ORM = new Waterline(),
    Agents = require('./server/models/agents'),
    Profiles = require('./server/models/profiles'),
    Users = require('./server/models/users');

Q.longStackSupport = true;


/**
 * Express app for the Master UI
 * @class appUi
 * @memberof App
 */
var AppUi = function (opts, db) {
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

  ///////////////////
  // FeathersJS

  ORM.loadCollection(Agents);
  ORM.loadCollection(Profiles);
  ORM.loadCollection(Users);
  ORM.initialize(self.waterline_config, function (err, data) {
    if (err) {
      console.error(err);
      throw new Error(err);
    }
    //console.warn('data:', data);

    const agents = service({
      Model: data.collections.agents,
      // pagination not yet supported by sails-arangodb
      paginate: {
        default: 2,
        max: 4
      }
    });

    const users = service({
      Model: data.collections.users,
      // pagination not yet supported by sails-arangodb
      paginate: {
        default: 2,
        max: 4
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
    console.log('db urls:', cfg.database_url);

    /*
     * check if user is authenticated
     */
//    self.app.isAuthenticated = function(req, res, next) {
//      console.log('isAuthenticated: req.headers:', req.headers);
//      console.log('isAuthenticated: req.cookies:', req.cookies);
//      req.headers.Authorization = req.cookies['feathers-jwt'];
//
//      console.log('isAuthenticated: req.headers.Authorization:', req.headers.Authorization);
//
//      jwt.verify(
//        req.headers.Authorization,
//        cfg.token.secret,
//        //{}, //options,
//        function (error, payload) {
//          if (error) {
//            // Invalid or expired token.
//            console.error('user not authenticated, error:', error);
//            return res.redirect('/');
//          } else {
//            // User is logged on in the application.
//            console.log('User is authenticated');
//            console.log('payload:', payload);
//            return next();
//          }
//        }
//      );
//    };


    var store = new ArangoDBStore({
      url: cfg.database_url,
      dbName: cfg.database_name
    });

    store.on('error', function (err) {
      if (err) {
        throw new Error(err);
      }
    });

    self.app
    .use(cors())
//    .use(expressSession({
//      secret: cfg.token.secret,
//      store: store,
//      resave: true,
//      saveUninitialized: true
//    }))
    .use(compression())
    .use(logger)
    .use('/', staticServe('public'))  // assets
    .use('/dist', staticServe('dist'))
    .use('/node_modules', staticServe('node_modules'))
    .use(flash())
    .configure(rest())
    .configure(socketio(function (io) {
      console.log('socketio created **********************************************');

      io.on('connection', function (socket) {
        console.log('socket connection recvd');

        socket.on('login', function(entity, info) {
          console.log('(Socket) User logged in', entity);
          console.log('(Socket) user:', socket.user);
        });

        socket.on('logout', function(tokenPayload, info) {
          console.log('(Socket) User logged out', tokenPayload);
        });
      });

      io.use(function (socket, next) {
        //console.log('socket event:', socket);
        next();
      });
    }))
    .configure(hooks())
    //.use(express.static('public')); // /assets, /css. etc
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .set('query parser', 'extended')
    .use(cookieParser())


    .configure(
      auth({
        secret: cfg.token.secret,
        cookie: {
          maxAge: 1000 * 60 * 60 * 25 // 1 day
        }
//        local: {
//          assignProperty: 'user'
//        }
      })
    )
    .configure(local())
    .configure(jwt())
    .use('/users', users)
    ;

    self.app.service('authentication').hooks({
      before: {
        create: [
          // You can chain multiple strategies
          auth.hooks.authenticate(['jwt', 'local'])
        ]
//        remove: [
//          auth.hooks.authenticate('jwt')
//        ]
      }
    })

    self.app.use('/', routerUi);

    require('./lib/ui/routes')(routerUi, cfg, db.getDb(), serverMetrics, self.app, auth.hooks);

  //  self.app.use('/node_modules', express.static('node_modules'));


    self.app.set('views', 'public/views');
    self.app.set('view engine', 'ejs');
    self.app.locals = {
      banner: utils.getBanner(),
      master_hostname: cfg.partout_master_hostname,
      master_api_port: cfg.partout_api_port,
      role: 'master'
    }
    self.app.engine('html', require('ejs').renderFile);
    self.app.use(errorHandler());

    ///////////////////////////////////////////
    // Feathers services (REST + WebSockets)

//    self.app.use('/agents', self.app.isAuthenticated, function (req, res, next) {
    self.app.use('/agents', function (req, res, next) {
//      console.log('agents req:', req);
      next();
    }, agents);

//    self.app.use('/users', self.app.isAuthenticated, function (req, res, next) {

    self.app.service('users').hooks({
      before: {
        find: [
          auth.hooks.authenticate('jwt')
        ],
        create: [
          local.hooks.hashPassword({ passwordField: 'password' })
        ]
      }
    });

//    self.app.service('users').create({
//      email: 'admin@feathersjs.com',
//      password: 'admin'
//    })

    ///////////////////////////////////////////
//    self.app.use(errorHandler);

    self.app.on('login', function(entity, info) {
      console.log('(Rest) User logged in', entity);
    });
    self.app.on('logout', function(tokenPayload, info) {
      console.log('(Rest) User logged out', tokenPayload);
    });

    var server = httpsUi.createServer(optionsUi, self.app)
    .listen(cfg.partout_ui_port);
    console.info('Master UI listening on port', cfg.partout_ui_port);

    var io = require('socket.io').listen(server);

    self.app.setup(server);
  });

};

module.exports = AppUi;
