/*jslint node: true, nomen: true, vars: true*/
'use strict';

var console = require('better-console'),
  _ = require('lodash'),
  utils = new (require('./utils'))(),
  path = require('path'),
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  nimble = require('nimble'),
  Q = require('q');

var Policy_Sync = function (app) {
  var self = this;

  self.app = app;
  self.https = app.https;
  self.server_cert = null;
};

/**
 * Return a promise of completion of getting master https server's ssl cert
 */
Policy_Sync.prototype.get_server_cert = function () {
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
      path: '/_getManifest',
      method: 'GET',
      rejectUnauthorized: false
      //requestCert: true,
      //agent: false,

      //ca: [ self.server_cert ] // TODO: need to setup ca cert chain 1st
    },
    buffer = '';
  console.log('get_manifest() server_cert:\n' + self.server_cert);

  options.agent = new self.https.Agent(options);

  self.https.get(options, function (res) {
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
      path: '/_getFile?file=' + file,
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
  console.log('get server cert');
  self.get_server_cert()
  .then(function (cert) {
    console.log('promise cert:', cert);
    self.server_cert = '-----BEGIN CERTIFICATE-----\n' +
      cert.raw.toString('base64') +
      '\n-----END CERTIFICATE-----\n';

    console.log('sync server_cert:\n' + self.server_cert);

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

  }); // cert promise

};

module.exports = Policy_Sync;
