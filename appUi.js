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

Q.longStackSupport = true;

/**
 * Express app for the Master UI
 * @class appUi
 * @memberof App
 */
var AppUi = function (opts, services) {
  var self = this;

  self.services = services;

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

  var store = new ArangoDBStore({
    url: cfg.database_url,
    dbName: cfg.database_name
  });

  store.on('error', function (err) {
    if (err) {
      throw new Error(err);
    }
  });

  function customizeJWTPayload() {
    return function(hook) {
      console.log('Customizing JWT Payload, hook.params:', hook.params);
      hook.data.payload = {
        // You need to make sure you have the right id.
        // You can put whatever you want to be encoded in
        // the JWT access token.
        userId: hook.params.user._key
      };

      return Promise.resolve(hook);
    };
  }

  self.app
  .use(cors())
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
      },
      session: false
//        extraFields: {
//          payload: ['id', 'user', 'name']
//        }
//        local: {
//          assignProperty: 'user'
//        }
    })
  )
  .configure(local({
    name: 'local',
    usernameField: 'username'
//      extraFields: {
//          payload: ['id', 'user', 'name']
//      }
  }))
  .configure(jwt({
//      extraFields: {
//          payload: ['id', 'user', 'name']
//      }
  }))
  .use('/users', self.services.users)
  .use('/agents', self.services.agents)
  .use('/agents_all', self.services.agents)
  .use('/csrs', self.services.csrs)
  .use('/csrs_all', self.services.csrs)
  .use('/environments', self.services.environments)
  .use('/roles', self.services.roles)
  ;

  self.app.service('authentication').hooks({
    before: {
      create: [
        // You can chain multiple strategies
        auth.hooks.authenticate(['jwt', 'local']),
        customizeJWTPayload()
      ],
      remove: [
        auth.hooks.authenticate('jwt')
      ]
    }
  });

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
  self.app.use(errorHandler());

  ///////////////////////////////////////////
  // Feathers services (REST + WebSockets)

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

  self.app.service('roles').hooks({
    before: {
      find: [
        auth.hooks.authenticate('jwt')
      ]
    }
  });

  self.app.service('agents').hooks({
    before: {
      find: [
        auth.hooks.authenticate('jwt')
      ]
    },
    after: {
      create: [
        (hook) => {
          self.app.service('agents_all').emit('created', []); // tell agents_all
        }
      ],
      remove: [
        (hook) => {
          self.app.service('agents_all').emit('removed', []); // tell agents_all
        }
      ],
      update: [
        (hook) => {
          self.app.service('agents_all').emit('updated', []); // tell agents_all
        }
      ],
    }
  });

  self.app.service('agents_all').hooks({
    before: {
      find: [
        auth.hooks.authenticate('jwt'),
        (hook) => { // allow client to disable pagination
          hook.service.paginate = false;

          // handle lastSeenBucket
          hook.params.query.$select = hook.params.query.$select.map(x => { return x === 'lastSeenBucket' ? 'lastSeen' : x; });
          //hook.params.query.$sort = hook.params.query.$sort.map(x => { return x === 'lastSeenBucket' ? 'lastSeen' : x; });
        }
      ]
    },
    after: {
      find: [
        (hook) => {
          hook.result.forEach(function (r) {
            if (r.lastSeen === undefined) {
              return;
            }
            let n = Date.now(); // millisecs since 1970
            let aday = 1000 * 60 * 60 * 24;
            let lastSeen = Date.parse(r.lastSeen);

            if (lastSeen > (n - aday) ) {
              r.lastSeenBucket = '< 1 day';

            } else if (lastSeen > (n - aday * 2)) {
              r.lastSeenBucket = '< 2 days';

            } else if (lastSeen > (n - aday * 5)) {
              r.lastSeenBucket = '< 5 days!';

            } else if (lastSeen > (n - aday * 31)) {
              r.lastSeenBucket = '< 31 days!!';

            } else {
              r.lastSeenBucket = '> 31 days!!!';
            }
          });
        }
      ]
    }
  });

  self.app.service('csrs').hooks({
    before: {
      find: [
        auth.hooks.authenticate('jwt')
      ],
      update: [
        (options) => {
          return new Promise((resolve, reject) => {

            if (options.data.status === 'signed' && !options.data.cert) {
              console.log('signing csr');
              ca.signCsrWithAgentSigner(options.data.csr, options.data.id)  // sign adding key/uuid as given name
              .then(function (signed) {
                console.info('Signed cert from csr:\n' + signed.certPem);

                // return to agent via the csr document in db
                options.data.cert = signed.cert;
                options.data.certPem = signed.certPem;

//                  console.log('csr signed, options:', options);
                resolve(options);
              })
              .fail(err => {
                console.error(err);
                reject(err);
              });

            } else if (options.data.status === 'rejected' && options.data.cert) {
              delete options.data.cert;
              delete options.data.certPem;

              resolve(options);
            } else {
              resolve();
            }
          });
        }
      ]
    },
    after: {
      create: [
        (hook) => {
          self.app.service('csrs_all').emit('created', []); // tell csrs_all
        }
      ],
      remove: [
        (hook) => {
          self.app.service('csrs_all').emit('removed', []); // tell csrs_all
        }
      ],
      update: [
        (hook) => {
          self.app.service('csrs_all').emit('updated', []); // tell csrs_all
        }
      ],
    }
  });

  self.app.service('csrs_all').hooks({
    before: {
      find: [
        auth.hooks.authenticate('jwt'),
        (hook) => { // allow client to disable pagination
//            console.log('agents: hook:', hook);
//            console.log('agents: params:', hook.params);
          hook.service.paginate = false;
//            delete hook.params.query.$paginate;
        }
      ]
    }
  });

  self.app.service('environments').hooks({
    before: {
      find: [
        auth.hooks.authenticate('jwt')
      ]
    }
  });

  ///////////////////////////////////////////

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

};

module.exports = AppUi;
