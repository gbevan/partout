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
    deferred = Q.defer();

  self.app.master.get('/')
  .then(function (obj) {
    var page = obj.page,
      cert = obj.cert;
    //console.log('page:', page, 'server cert:', cert);
    deferred.resolve(cert);
  })
  .fail(function (err) {
    //console.error('get_master_cert failed err:', err);
    deferred.reject(err);
  })
  .done();

  return deferred.promise;
};


Policy_Sync.prototype.get_file = function (file, cb) {
  var self = this,
    dir = path.dirname(file),
    base_file = path.basename(file);

  self.app.master.get('/file?file=' + file)
  .then(function (obj) {
    var buffer = obj.data;
    mkdirp(dir, function (err) {
      if (err) {
        console.error(err);
      }
      fs.writeFile(file, buffer, cb);
    });
  })
  .done();
};

Policy_Sync.prototype.sync = function (folder) {
  var self = this,
    outer_deferred = Q.defer();

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

    console.log('after master fingerprint test - syncing:', folder);
    //self.get_manifest(function (manifest) {
    self.app.master.get('/manifest')
    .then(function (obj) {
      var manifest = obj.data;
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
        //console.log('tasks:', tasks);
        nimble.series(tasks, function () { outer_deferred.resolve(); });

      });

    })
    .done();

  })

  .fail(function (err) {
    console.error('policy_sync err:', err);
    //console.log(err.stack);
    outer_deferred.reject(err);
  }); // cert promise

  return outer_deferred.promise;
};

module.exports = Policy_Sync;
