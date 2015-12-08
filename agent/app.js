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
  ssl = new (require('./lib/ssl'))(),
  privateKeyFile = ssl.agentPrivateKeyFile,
  publicKeyFile = ssl.agentPublicKeyFile,
  csrFile = ssl.agentCsrFile,
  certFile = ssl.agentCertFile,
  Master = require('./lib/master');

Q.longStackSupport = true;


var _sendCsr = function (master) {
  var deferred = Q.defer();
  master.post('/agentcsr', {csr: fs.readFileSync(ssl.agentCsrFile).toString()})
  .then(function (resp) {
    //console.log('resp:', resp);

    master.sendevent({
      object: 'partout-agent',
      module: 'app',
      msg: 'Partout-Agent has sent CSR'
    });
    deferred.resolve(resp);
  })
  .fail(function (err) {
    console.error(err);
    deferred.reject(new Error(err));
  });

  return deferred.promise;
};

var apply = function (args, opts) {
  var policy = new Policy(args, opts);
  policy.apply();
};

var serve = function () {
  console.log('Serve');

  // TODO: replace self-signed cert below with CSR Request/Sign via master protocol

  // TODO: test for Csr file vs cert
  var master = new Master(cfg, https);

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
          }, function (err, csr) {
            console.log('genCsr err:', err, 'csr:', csr);

            // Send csr to master
            console.warn('Sending agent certificate signing request to master');

            _sendCsr(master)
            .then(function(resp) {
              console.log('response to new csr:', resp);
            });

          });
        } else {
          _sendCsr(master)
          .then(function(resp) {
            console.log('response to existing csr:', resp);
          });
        }
      });

    } else { // cert exists

      var app = express(),
        ssl_options = {
          key: sslKey,
          cert: sslCert
        };

      // TODO: parameterise from a js file
      app.master = cfg.partout_master_hostname;
      app.master_port = cfg.partout_master_port;
      app.apply_every_mins = 5;
      app.poll_manifest_every = 6;
      app.poll_manifest_splay_secs = 30;
      app.apply_count = 0;
      app.apply_site_p2 = 'etc/manifest/site.p2';
      app.https = https;
      app.PARTOUT_AGENT_SSL_PUBLIC = './etc/ssl_public';

      app.clientCert = sslCert;
      app.clientKey = sslKey;

      app.sendevent = master.sendevent;


      process.on('SIGINT', function () {
        app.sendevent({
          module: 'app',
          object: 'partout-agent',
          msg: 'Agent terminating due to SIGINT'
        }, function (resp) {
          process.exit(1);
        });
      });
      process.on('SIGTERM', function () {
        app.sendevent({
          module: 'app',
          object: 'partout-agent',
          msg: 'Agent terminating due to SIGTERM'
        }, function (resp) {
          process.exit(1);
        });
      });

      var policy_sync = new Policy_Sync(app);

      app._apply = function (cb) {
        fs.exists(app.apply_site_p2, function (exists) {
          if (!exists) {
            console.error('Error: site policy file', app.apply_site_p2, 'does not yet exist');
          } else {
            console.log('applying');
            apply([app.apply_site_p2], {app: app, daemon: true});
          }
          cb();
        });
      };

      app.run = function () {
        console.log('### START #######################################################');
        var splay = (app.apply_count === 0 ? 0 : app.poll_manifest_splay_secs * 1000 * Math.random()) ;

        if ((app.apply_count++ % app.poll_manifest_every) === 0) {

          setTimeout(function () {
            policy_sync.sync('etc/manifest', function () {
              console.log('sync done');

              app._apply(function () {
                console.log('### FINI (after sync) ###########################################');
              });
            });
          }, splay);  // Random Splay

        } else {
          app._apply(function () {
            console.log('### FINI (no sync) ##############################################');
          });
        }
      };

      router.use(morgan('combined'));

      router.get('/', function (req, res, next) {
        res.send('Hello');
      });

      app.use('/', router);

      https.createServer(ssl_options, app)
        .listen(10444);

      app.sendevent({
        module: 'app',
        object: 'partout-agent',
        msg: 'Partout-Agent has (re)started'
      })
      .then(function () {
        app.run();
        setInterval(function () {
          app.run();
        }, (app.apply_every_mins * 60 * 1000));
      })
      .fail(function (err) {
        console.error('app run failed, err:', err);
        console.log(err.stack);
      });
    }
  });
};

module.exports = function (opts) {
  if (opts.apply) {
    apply(opts.args, {daemon: false});

  } else if (opts.facts) {
    apply({}, {daemon: false, showfacts: true});

  } else if (opts.serve) {
    // Start a keep-alive - for handling Agent CSR signing delay
    var reexec = function () {
      process.nextTick(function () {
        console.error('running serve');
        serve(opts.args);
        setTimeout(function () {
          reexec();
        }, 60 * 1000); // TODO: Splay timing
      });
    };
    reexec();

  } else {
    throw new Error('Unrecognised directive:' + JSON.stringify(opts));
  }
};
