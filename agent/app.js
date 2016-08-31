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
    express = require('express'),
    router = express.Router(),
    https = require('https'),
    pki = require('node-forge').pki,
    morgan = require('morgan'),
    logger = morgan('combined'),
    fs = require('fs'),
    sslKey,
    sslCert,
    os = require('os'),
    path = require('path'),
    hostName = os.hostname(),
    Policy = require('./lib/policy'),
    Policy_Sync = require('./lib/policy_sync'),
    querystring = require('querystring'),
    Q = require('q'),
    pfs = new (require('./lib/pfs'))(),
    cfg = new (require('./etc/partout_agent.conf.js'))(),
    ssl = new (require('./lib/ssl'))(cfg),
    privateKeyFile = ssl.agentPrivateKeyFile,
    publicKeyFile = ssl.agentPublicKeyFile,
    csrFile = ssl.agentCsrFile,
    certFile = ssl.agentCertFile,
    Master = require('./lib/master'),
    utils = new (require('./lib/utils'))();

Q.longStackSupport = true;

var MYUUID_FILE = path.join(cfg.PARTOUT_VARDIR, 'UUID');
var MYUUID = (fs.existsSync(MYUUID_FILE) ? fs.readFileSync(MYUUID_FILE).toString() : '');

var _sendCsr = function (master/*, env*/) {
  var deferred = Q.defer();
  master.post('/agentcsr', {
    uuid: MYUUID,
    //env: env,
    csr: fs.readFileSync(ssl.agentCsrFile).toString()
  })
  .then(function (resp) {
    //console.log('resp to agentcsr:', resp);
    if (resp === 'Unauthorized') {
      console.error('Master returned "Unauthorized"...');
      throw 'Unauthorized';
    }
    resp = JSON.parse(resp);
    master.sendevent({
      object: 'partout-agent',
      module: 'app',
      msg: 'Partout-Agent has sent CSR'
    });

    // save returned UUID
    if (resp.uuid) {
      fs.writeFileSync(MYUUID_FILE, resp.uuid);
      MYUUID = resp.uuid;
    }
    deferred.resolve(resp);
  })
  .fail(function (err) {
    console.error(err);
    deferred.reject(new Error(err));
  });

  return deferred.promise;
};

var apply = function (args, opts) {
  var deferred = Q.defer();
  //var policy = new Policy(args, opts);
  new Policy(args, opts)
  .then(function (policy) {
    //console.log('policy:', policy);
    policy.apply()
    .then(function () {
      utils.dlog('policy.apply() resolved');
      deferred.resolve();
    })
    .done(null, function (err) {
      console.error('App policy apply failed err:', err);
      deferred.reject(err);
    });
  })
  .done(null, function (err) {
    console.error('apply outer err:', err);
  });
  return deferred.promise;
};

var checkCert = function (master/*, env*/) {
  var deferred = Q.defer();

  console.info('=============================');
  console.info('Checking Agent Certificate...');
  console.info('=============================');

  //var master = new Master(cfg, https);

  pfs.pExists(certFile)
  .then(function (cert_exists) {
    if (!cert_exists) {
      pfs.pExists(csrFile)
      .then(function (csr_exists) {
        if (!csr_exists) {

          // Generate this agent's csr
          var attrs = [{
            name: 'commonName',
            value: hostName
          }, {
            shortName: 'OU',
            value: 'Partout'
          }];

          ssl.genCsr({
            subjAttrs: attrs,
//            extensions: [
//              {
//                name: 'subjectAltname',
//                altnames: [{
//                  value: 'AUUID-HERE'
//                }]
//              }
//            ]
          }, function (err, csr, fingerprint) {
            if (err) {
              console.error('genCsr() failed err:', err);
              process.exit(1);
            }
            console.warn('============================================================================');
            console.warn('CSR fingerprint:', fingerprint);
            console.warn('============================================================================');

            // Send csr to master
            console.warn('Sending agent certificate signing request to master');

            _sendCsr(master/*, env*/)
            .then(function(resp) {
              //console.log('response to new csr:', resp.status);

              deferred.resolve(false);
            }).done();

          });
        } else {
          _sendCsr(master/*, env*/)
          .then(function(resp) {
            //console.log('type:', typeof(resp));
            console.warn('response to existing csr:', resp.status);

            if (resp.status === 'signed') {
              // handle signed csr
              Q.nfcall(fs.writeFile, certFile, resp.certPem)
              .then(function () {
                console.log('agent certificate created, continuing');
                deferred.resolve(true);
              })
              .done();
            } else {
              deferred.resolve(false);
            }
          });
        }
      }).done();

    } else { // cert exists
      console.log('agent certificate exists, continuing');
      deferred.resolve(true);
    }
  })
  .done();

  return deferred.promise;
};

var serve = function (opts, master/*, env*/) {
  console.info('========================');
  console.info('Starting Policy Agent...');
  console.info('========================');

  var args = opts.args;

  sslKey = fs.readFileSync(privateKeyFile);
  sslCert = fs.readFileSync(certFile);

  //console.log('sslKey:', sslKey.toString());
  //console.log('sslCert:', sslCert.toString());

  var app = express(),
      ssl_options = {
        key: sslKey,
        cert: sslCert,
        ca: [
          fs.readFileSync(path.join(cfg.PARTOUT_AGENT_SSL_PUBLIC, 'intermediate_ca.crt'), 'utf8'),
          fs.readFileSync(path.join(cfg.PARTOUT_AGENT_SSL_PUBLIC, 'root_ca.crt'), 'utf8')
        ],
        requestCert: true,
        rejectUnauthorized: false
      };


  master.set_agent_cert(sslKey, sslCert);
  master.set_app(app);

  //app.environment = env;
  app.opts = opts;
  //console.log('app.opts:', app.opts);

  // TODO: parameterise from a js file
  app.master_hostname = cfg.partout_master_hostname;
  console.log('master_hostname:', app.master_hostname);
  app.master_port = cfg.partout_master_port;

  // TODO: Move these to config file
  app.apply_every_mins = 5; // 5
  app.poll_manifest_every = 3;
  app.poll_manifest_splay_secs = 30;  // TODO: make this % of apply interval

  app.apply_count = 0;  // count for the modulus calc of polls for manifest
//  app.apply_site_p2 = cfg.PARTOUT_AGENT_MANIFEST_SITE_P2;
  app.https = https;
  app.PARTOUT_AGENT_SSL_PUBLIC = cfg.PARTOUT_AGENT_SSL_PUBLIC;

  app.clientCert = sslCert;
  app.clientKey = sslKey;

  app.master = master;
  app.cfg = cfg;
  app.sendevent = function (o, cb) {
    return app.master.sendevent(o, cb);
  };

  app.uuid = MYUUID;
  //app.master.set_uuid(app.uuid);
  console.info('Agent UUID:', MYUUID);

  app.inRun = false;

  process.on('SIGINT', function () {
    app.sendevent({
      module: 'app',
      object: 'partout-agent',
      msg: 'Agent terminating due to SIGINT'
    }, function (resp) {
      console.error('sendevent resp:', resp);
      process.exit(1);
    });
    setTimeout(function () {
      process.exit(1); // for now
    }, 1000);
  });
  process.on('SIGTERM', function () {
    app.sendevent({
      module: 'app',
      object: 'partout-agent',
      msg: 'Agent terminating due to SIGTERM'
    }, function (resp) {
      console.error('sendevent resp:', resp);
      process.exit(1);
    });
    setTimeout(function () {
      process.exit(1); // for now
    }, 1000);
  });


  var policy_sync = new Policy_Sync(app);

  app._apply = function (cb) {

    if (!app.apply_site_p2) {
      console.warn('Policy Sync has not yet resolved a site policy. Please ensure this agent has been assigned to a valid environment by the Partout Master Administrator (see `partout setenv` command).');
      cb();
      return;
    }

    fs.exists(app.apply_site_p2, function (exists) {
      if (!exists) {
        console.error('Error: site policy file', app.apply_site_p2, 'does not yet exist');
        cb();
      } else {
        //console.log('applying');
        apply([app.apply_site_p2], {app: app, daemon: true})
        .then(function () {
          console.log('apply resolved');
          cb();
        })
        .done(null, function (err) {
          console.error('app _apply err:', err);
          console.error(err.stack);
          cb();
        });
      }
      //cb();
    });
  };

  app.run = function () {
    var deferred = Q.defer();

    console.log('### START #######################################################');
    app.inRun = true;

    var splay = (app.apply_count === 0 ? 0 : app.poll_manifest_splay_secs * 1000 * Math.random()) ;

    if ((app.apply_count++ % app.poll_manifest_every) === 0 || !app.apply_site_p2) {

      setTimeout(function () {

        // TODO: handle environment in sync
        // policy_sync.sync(self.app.environment, cfg.PARTOUT_AGENT_MANIFEST_DIR)

        policy_sync.sync(cfg.PARTOUT_MASTER_MANIFEST_DIR, cfg.PARTOUT_AGENT_MANIFEST_DIR)
        .then(function () {
          //console.log('sync done');

          //console.log('after policy_sync app.cfg.environment:', app.cfg.environment);

          app.apply_site_p2 = cfg.PARTOUT_AGENT_MANIFEST_SITE_P2;
          //console.log('app.apply_site_p2:', app.apply_site_p2);

          app._apply(function () {
            app.inRun = false;
            console.log('### FINISHED POLICY (after sync) ###########################################');
            deferred.resolve();
          });
        })
        .fail(function (err) {
          console.error(err);
          console.error(err.stack);
          console.warn('policy_sync call failed, will continue to run existing cached manifest (if available)');

          app._apply(function () {
            app.inRun = false;
            console.log('### FINISHED POLICY (after FAILED sync) ###########################################');
            deferred.resolve();
          });
        })
        .done();
      }, splay);  // Random Splay

    } else {
      app._apply(function () {
        app.inRun = false;
        console.log('### FINISHED POLICY (no sync) ##############################################');
        deferred.resolve();
      });
    }

    return deferred.promise;
  };

  router.use(morgan('combined'));

  router.get('/', function (req, res, next) {
    res.send('Partout Agent API...\n\r');
  });

  require('./lib/api/routes')(router, cfg);

  app.use('/', router);

  //console.log('before https server');
  https.createServer(ssl_options, app)
    .listen(10444);
  //console.log('after https server');

  //app.sendevent({
  master.qEvent({}, {
    module: '_app',
    object: 'partout-agent',
    msg: 'Partout-Agent has (re)started https server'
  });
  //.then(function () {
  app.run()
  .done(function () {
    if (opts.once) {
      process.exit(0);
    }
  }, function (err) {
    console.error('server run err:', err);
    if (opts.once) {
      process.exit(0);
    }
  });

  if (!app.opts.once) {
    setInterval(function () {
      if (!app.inRun) {
        app.run();
//        .done(function () {
//          console.log('run complete in loop');
//        });
      } else {
        console.warn('Previous policy overran apply interval, skipping...');
      }
    }, (app.apply_every_mins * 60 * 1000))
    .unref();
  }

};

module.exports = function (opts) {
  if (opts.apply) {
    apply(opts.args, {daemon: false});

  } else if (opts.facts) {
    apply({}, {daemon: false, showfacts: true});

  } else if (opts.serve) {
    console.info('Starting Partout Agent...');
    utils.print_banner();

    // Ensure var path exists
    utils.dlog('Ensuring path:', cfg.PARTOUT_VARDIR);
    Q.nfcall(pfs.ensurePath, cfg.PARTOUT_VARDIR)
    .then(function () {

      // Save environment if specified as option (--env)
//      var env = cfg.setEnvironment(opts.env);
//      opts.env = env;
//
//      console.info('Environment:', opts.env);

      var master = new Master(cfg, https);

      // Start a keep-alive - for handling Agent CSR signing delay
      var reexec = function () {
        process.nextTick(function () {
          checkCert(master /*, opts.env*/)
          .then(function (result) {
            if (result) {
              serve(opts, master /*, opts.env*/);
            } else {
              setTimeout(function () {
                reexec();
              }, 60 * 1000); // TODO: Splay timing
            }
          })
          .done();
        });
      };
      reexec();


    })
    .done();

  } else {
    throw new Error('Unrecognised directive:' + JSON.stringify(opts));
  }
};
