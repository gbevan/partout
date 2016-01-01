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
  utils = new (require('./lib/utils'))(),
  cfg = new (require('./etc/partout_agent.conf.js'))(),
  ssl = new (require('./lib/ssl'))(cfg),
  privateKeyFile = ssl.agentPrivateKeyFile,
  publicKeyFile = ssl.agentPublicKeyFile,
  csrFile = ssl.agentCsrFile,
  certFile = ssl.agentCertFile,
  Master = require('./lib/master');

Q.longStackSupport = true;

var MYUUID_FILE = path.join(cfg.PARTOUT_VARDIR, 'UUID');
var MYUUID = (fs.existsSync(MYUUID_FILE) ? fs.readFileSync(MYUUID_FILE).toString() : '');

var _sendCsr = function (master) {
  var deferred = Q.defer();
  master.post('/agentcsr', {
    uuid: MYUUID,
    csr: fs.readFileSync(ssl.agentCsrFile).toString()
  })
  .then(function (resp) {
    console.log('resp to agentcsr:', resp);
    resp = JSON.parse(resp);
    master.sendevent({
      object: 'partout-agent',
      module: 'app',
      msg: 'Partout-Agent has sent CSR'
    });

    // save returned UUID
    if (resp._key) {
      fs.writeFileSync(MYUUID_FILE, resp._key);
      MYUUID = resp._key;
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
      console.log('policy.apply() resolved');
      deferred.resolve();
    })
    .done();
  })
  .done();
  return deferred.promise;
};

var checkCert = function (args, master) {
  var deferred = Q.defer();

  console.info('=============================');
  console.info('Checking Agent Certificate...');
  console.info('=============================');

  //var master = new Master(cfg, https);

  utils.pExists(certFile)
  .then(function (cert_exists) {
    if (!cert_exists) {
      utils.pExists(csrFile)
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
            subjAttrs: attrs
          }, function (err, csr, fingerprint) {
            console.warn('============================================================================');
            console.warn('CSR fingerprint:', fingerprint);
            console.warn('============================================================================');

            // Send csr to master
            console.warn('Sending agent certificate signing request to master');

            _sendCsr(master)
            .then(function(resp) {
              console.log('response to new csr:', resp.status);

              deferred.resolve(false);
            }).done();

          });
        } else {
          _sendCsr(master)
          .then(function(resp) {
            //console.log('type:', typeof(resp));
            console.warn('response to existing csr:', resp.status);

            if (resp.status === 'signed') {
              // TODO: handle signed csr
              Q.nfcall(fs.writeFile, certFile, resp.cert)
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

var serve = function (args, master) {
  console.info('========================');
  console.info('Starting Policy Agent...');
  console.info('========================');

  sslKey = fs.readFileSync(privateKeyFile);
  sslCert = fs.readFileSync(certFile);

  //console.log('sslKey:', sslKey.toString());
  //console.log('sslCert:', sslCert.toString());

  var app = express(),
    ssl_options = {
      key: sslKey,
      cert: sslCert
    };

  master.set_agent_cert(sslKey, sslCert);

  // TODO: parameterise from a js file
  app.master_hostname = cfg.partout_master_hostname;
  console.log('master_hostname:', app.master_hostname);
  app.master_port = cfg.partout_master_port;
  app.apply_every_mins = 5;
  app.poll_manifest_every = 6;
  app.poll_manifest_splay_secs = 30;
  app.apply_count = 0;
  app.apply_site_p2 = cfg.PARTOUT_AGENT_MANIFEST_SITE_P2;
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

  process.on('SIGINT', function () {
    app.sendevent({
      module: 'app',
      object: 'partout-agent',
      msg: 'Agent terminating due to SIGINT'
    }, function (resp) {
      console.error('sendevent resp:', resp);
      process.exit(1);
    });
    process.exit(1); // for now
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
    process.exit(1); // for now
  });


  //console.log('policy_sync');
  var policy_sync = new Policy_Sync(app);
  //console.log('after policy_sync');

  app._apply = function (cb) {
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
        .done();
      }
      //cb();
    });
  };

  app.run = function () {
    console.log('### START #######################################################');
    var splay = (app.apply_count === 0 ? 0 : app.poll_manifest_splay_secs * 1000 * Math.random()) ;

    if ((app.apply_count++ % app.poll_manifest_every) === 0) {

      setTimeout(function () {
        policy_sync.sync(cfg.PARTOUT_MASTER_MANIFEST_DIR, cfg.PARTOUT_AGENT_MANIFEST_DIR)
        .then(function () {
          //console.log('sync done');

          app._apply(function () {
            console.log('### FINISHED POLICY (after sync) ###########################################');
          });
        })
        .fail(function (err) {
          console.warn('policy_sync call failed, will continue to run existing cached manifest (if available)');

          app._apply(function () {
            console.log('### FINISHED POLICY (after FAILED sync) ###########################################');
          });
        })
        .done();
      }, splay);  // Random Splay

    } else {
      app._apply(function () {
        console.log('### FINISHED POLICY (no sync) ##############################################');
      });
    }
  };

  router.use(morgan('combined'));

  router.get('/', function (req, res, next) {
    res.send('Hello');
  });

  app.use('/', router);

  //console.log('before https server');
  https.createServer(ssl_options, app)
    .listen(10444);
  //console.log('after https server');

  app.sendevent({
    module: 'app',
    object: 'partout-agent',
    msg: 'Partout-Agent has (re)started https server'
  });
  //.then(function () {
  app.run();
  setInterval(function () {
    app.run();
  }, (app.apply_every_mins * 60 * 1000));
  //})
  //.fail(function (err) {
  //  console.error('app run failed, err:', err);
  //  console.log(err.stack);
  //})
  //.done();

};

module.exports = function (opts) {
  if (opts.apply) {
    apply(opts.args, {daemon: false});

  } else if (opts.facts) {
    apply({}, {daemon: false, showfacts: true});

  } else if (opts.serve) {
    // Ensure var path exists
    Q.nfcall(utils.ensurePath, cfg.PARTOUT_VARDIR)
    .then(function () {
      var master = new Master(cfg, https);

      // Start a keep-alive - for handling Agent CSR signing delay
      var reexec = function () {
        process.nextTick(function () {
          checkCert(opts.args, master)
          .then(function (result) {
            if (result) {
              serve(opts.args, master);
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
