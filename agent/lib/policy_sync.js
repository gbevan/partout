/*jslint node: true, nomen: true, vars: true*/
'use strict';

var console = require('better-console'),
  _ = require('lodash'),
  utils = new (require('./utils'))(),
  path = require('path'),
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  nimble = require('nimble'),
  Q = require('q'),
  pki = require('node-forge').pki,
  forge = require('node-forge'),
  readline = require('readline');

var Policy_Sync = function (app) {
  var self = this;

  self.app = app;
  self.https = app.https;
  self.server_cert = null;
};

/**
 * Load accepted master api ssl fingerprint
 * @return {Promise} then(function (data) {...})
 */
Policy_Sync.prototype.load_master_fingerprint = function () {
  var self = this,
    deferred = Q.defer(),
    fp = path.join(self.app.PARTOUT_AGENT_SSL_PUBLIC, 'master_fingerprint.dat');

  utils.pExists(fp)
  .then(function (exists) {
    if (exists) {
      Q.nfcall(fs.readFile, fp)
      .then(function (data) {
        data = data.toString().trim();
        deferred.resolve(data);
      });
    } else {
      deferred.resolve('');
    }
  });

  return deferred.promise;
};

/**
 * Save accepted master api ssl fingerprint
 */
Policy_Sync.prototype.save_master_fingerprint = function (fingerprint) {
  var self = this,
    deferred = Q.defer(),
    fp = path.join(self.app.PARTOUT_AGENT_SSL_PUBLIC, 'master_fingerprint.dat');

  return Q.nfcall(fs.writeFile, fp, fingerprint);
};

/**
 * Return a promise of completion of getting master https server's ssl cert
 */
Policy_Sync.prototype.get_master_cert = function () {
  var self = this,
    deferred = Q.defer(),
    options = {
      host: self.app.master, // TODO: param'ize
      port: self.app.master_port,
      method: 'GET',
      rejectUnauthorized: false
    };

  var req = self.https.request(options, function (res) {
    var cert = res.connection.getPeerCertificate();
    //console.log('server cert:', cert);
    deferred.resolve(cert);
  });

  req.end();

  return deferred.promise;
};

Policy_Sync.prototype.get_manifest = function (cb) {
  var self = this,
    options = {
      host: self.app.master, // TODO: param'ize
      port: self.app.master_port,
      path: '/manifest',
      method: 'GET',
      rejectUnauthorized: false,
      //requestCert: true,
      //agent: false,

      //ca: [ self.server_cert ] // TODO: need to setup ca cert chain 1st

      cert: self.app.clientCert,
      key: self.app.clientKey
    },
    buffer = '';
  //console.log('get_manifest() server_cert:\n' + self.server_cert);

  options.agent = new self.https.Agent(options);

  self.https.get(options, function (res) {
    if (res.statusCode !== 200) {
      console.error('Client authentication denied by master (csr may need signing to grant access)');
      return;
    }
    res.on('data', function (d) {
      buffer += d.toString();
    });
    res.on('end', function () {
      //console.log('full manifest buffer:', buffer);
      cb(JSON.parse(buffer));
    });
  });
};

Policy_Sync.prototype.get_file = function (file, cb) {
  var self = this,
    options = {
      host: self.app.master, // TODO: param'ize
      port: self.app.master_port,
      path: '/file?file=' + file,
      method: 'GET',
      rejectUnauthorized: false,
      //requestCert: true,
      agent: false
    },
    buffer = '';

  self.https.get(options, function (res) {
    res.on('data', function (d) {
      buffer += d.toString();
    });
    res.on('end', function () {
      //console.log('file buffer:', buffer);
      var dir = path.dirname(file);
      var base_file = path.basename(file);

      mkdirp(dir, function (err) {
        if (err) {
          console.error(err);
        }
        fs.writeFile(file, buffer, cb);
      });
    });
  });
};

Policy_Sync.prototype.sync = function (folder, cb) {
  var self = this;
  self.accepted_master_fingerprint = '';
  //console.log('get server cert');

  self.load_master_fingerprint()
  .then(function (accepted_master_fingerprint) {
    self.accepted_master_fingerprint = accepted_master_fingerprint;
    return self.get_master_cert();
  })
  .then(function (cert) {
    var deferred = Q.defer();

    //console.log('promise cert:', cert);
    self.server_cert = '-----BEGIN CERTIFICATE-----\n' +
      cert.raw.toString('base64') +
      '\n-----END CERTIFICATE-----\n';

    self.server_cert_obj = pki.certificateFromPem(self.server_cert);

    self.master_fingerprint = pki.getPublicKeyFingerprint(
      self.server_cert_obj.publicKey,
      {
        encoding: 'hex',
        delimiter: ':',
        md: forge.md.sha256.create()
      }
    );

    console.warn(new Array(self.master_fingerprint.length + 1).join('='));
    console.warn('Master API SSL fingerprint (SHA256):\n' + self.master_fingerprint);
    console.warn(new Array(self.master_fingerprint.length + 1).join('='));

    if (self.accepted_master_fingerprint === '') {
      console.warn('Accept new master SSL as trusted, after verifying the above fingerprint (y/n):');

      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('(y/n)? ', function (answer) {
        rl.close();
        if (answer !== 'y') {
          var errmsg = 'Error: Master SSL fingerprint not accepted! aborting...';
          console.error(errmsg);
          throw new Error(errmsg);
        }

        deferred.resolve(self.save_master_fingerprint(self.master_fingerprint));
      });

    } else if (self.accepted_master_fingerprint !== self.master_fingerprint) {
      var errmsg = 'Error: Master SSL fingerprint does not match accepted fingerprint! aborting...';
      console.error(errmsg);
      throw new Error(errmsg);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  })
  .then(function () {

    console.log('syncing:', folder);
    self.get_manifest(function (manifest) {
      console.log('manifest:', manifest);

      // Get hashWalk of local manifest
      utils.hashWalk(folder, function (local_manifest) {
        //console.log('local_manifest:', local_manifest);

        var files = Object.keys(manifest),
          local_files = Object.keys(local_manifest),
          tasks = [];
        //console.log('files:', files);

        _.each(files, function (file) {
          tasks.push(function (done) {
            //console.log('file:', file, 'hash:', manifest[file]);

            if (!local_manifest[file]) {
              console.log('syncing new file:', file);
              // create it
              self.get_file(file, function (err) {
                if (err) {
                  console.error(err);
                }
                done();
              });

            } else if (local_manifest[file] !== manifest[file]) {
              console.log('syncing changed file:', file, local_manifest[file], '->', manifest[file]);
              // replace it
              self.get_file(file, function (err) {
                if (err) {
                  console.error(err);
                }
                done();
              });
            } else {
              done();
            }
          });
        });

        _.each(local_files, function (file) {
          tasks.push(function (done) {
            if (!manifest[file]) {
              // delete local file
              console.log('removing file:', file);
              fs.unlink(file, function (err) {
                if (err) {
                  console.error(err);
                }
                done();
              });
            }
            done();
          });
        });

        nimble.series(tasks, cb);

      });

    });

  })

  .fail(function (err) {
    console.error(err);
    console.log(err.stack);
  }); // cert promise

};

module.exports = Policy_Sync;
