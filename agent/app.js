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
  keyFile = 'etc/ssl/agent.key',
  csrFile = 'etc/ssl/agent.csr',
  certFile = 'etc/ssl/agent.crt',
  sslKey,
  sslCert,
  os = require('os'),
  path = require('path'),
  hostName = os.hostname(),
  Policy = require('./lib/policy'),
  Policy_Sync = require('./lib/policy_sync'),
  querystring = require('querystring'),
  Q = require('q');

Q.longStackSupport = true;

/**
 * send event to master
 * @function
 * @param {Object} - {
 *    module: 'file',
 *    object: filename,
 *    msg: string of actions taken
 *  }
 * @memberof P2
 */
var _sendevent = function (o, cb) {
  console.warn('sendevent: msg:', o.msg);

  var deferred = Q.defer();

  var app = this,
    post_data = querystring.stringify(o),
    options = {
      host: app.master, // TODO: param'ize
      port: app.master_port,
      path: '/event',
      method: 'POST',
      rejectUnauthorized: true,
      requestCert: true,
      agent: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
      },
      ca: [
        fs.readFileSync(path.join(app.PARTOUT_AGENT_SSL_PUBLIC, 'root_ca.crt')),
        fs.readFileSync(path.join(app.PARTOUT_AGENT_SSL_PUBLIC, 'intermediate_ca.crt'))
      ]
      //checkServerIdentity: function (servername, cert) {
      //  console.log('servername:', servername, 'cert:', cert);
      //  return undefined; // or err
      //}
    };

  //options.agent = new https.Agent(options);

  var post_req = app.https.request(options, function(res) {
    var data = '';

    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.warn('Response: ' + chunk);
      data += chunk;
    });

    res.on('end', function () {
      if (cb) {
        cb(data);
      }
      deferred.resolve(data);
    });
  });

  post_req.write(post_data);
  post_req.end();

  post_req.on('error', function (err) {
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
  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    sslKey = fs.readFileSync(keyFile);
    sslCert = fs.readFileSync(certFile);
  } else {
    console.log('Generating self-signed cert');

    var keys = pki.rsa.generateKeyPair(2048),
      cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 30);
    var attrs = [{
      name: 'commonName',
      value: hostName
    }, {
      shortName: 'OU',
      value: 'Partout Agent'
    }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    // cert.setExtensions...?
    cert.setExtensions([{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'subjectAltName',
      altNames: [{
        type: 6, // URI
        value: 'http://example.org/webid#me'
      }]
    }]);

    cert.publicKey = keys.publicKey;

    cert.sign(keys.privateKey);
    //console.log('cert:', cert);

    var pem = {
      'private': pki.privateKeyToPem(keys.privateKey),
      'public': pki.publicKeyToPem(keys.publicKey),
      'cert': pki.certificateToPem(cert)
    };

    //console.log('pem:', pem);

    sslKey = pem['private'];
    sslCert = pem.cert;
    fs.writeFileSync(keyFile, sslKey);
    fs.writeFileSync(certFile, sslCert);
  }

  //console.log(pems);
  // TODO: Move new cert into mongodb to make permanent

  var app = express(),
    ssl_options = {
      key: sslKey,
      cert: sslCert
    };

  // TODO: parameterise from a js file
  app.master = 'officepc.net';
  app.master_port = 10443;
  app.apply_every_mins = 5;
  app.poll_manifest_every = 6;
  app.poll_manifest_splay_secs = 30;
  app.apply_count = 0;
  app.apply_site_p2 = 'etc/manifest/site.p2';
  app.https = https;
  app.PARTOUT_AGENT_SSL_PUBLIC = './etc/ssl_public';

  app.clientCert = sslCert;
  app.clientKey = sslKey;

  app.sendevent = _sendevent;

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
};

module.exports = function (opts) {
  if (opts.apply) {
    apply(opts.args, {daemon: false});

  } else if (opts.facts) {
    apply({}, {daemon: false, showfacts: true});

  } else if (opts.serve) {
    serve(opts.args);

  } else {
    throw new Error('Unrecognised directive:' + JSON.stringify(opts));
  }
};
