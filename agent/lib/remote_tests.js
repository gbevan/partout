/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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
'use strict';

var https = require('https'),
    cfg = new (require('../etc/partout_agent.conf.js'))(),
    console = require('better-console'),
    path = require('path'),
    fs = require('fs'),
    pfs = new (require('./pfs'))(),
    Q = require('q'),
    u = require('util'),
    utils = require('./utils');

Q.longStackSupport = true;

var RemoteTests = function () {
  var self = this;

};

RemoteTests.prototype.run = function () {
  var file = '../.test_remotes',
      deferred = Q.defer(),
      test_promises = [];

  pfs.pExists(file)
  .then(function (exists) {
    if (exists) {
      return pfs.pReadFile(file);
    } else {
      return Q.resolve();
    }
  })
  .done(function (test_remotes_file) {

    if (!test_remotes_file) {
      return;
    }

    test_remotes_file = test_remotes_file.toString();
    //console.log('test_remotes_file:', test_remotes_file);
    var remote_list = test_remotes_file.split(/\r?\n/);
    remote_list = remote_list.map(function (v) { return v.trim(); });

    remote_list.forEach(function (remote) {
      remote = remote.replace(/#.*$/, '');
      remote = remote.trim();
      if (remote.match(/^$/)) {
        return;
      }
      var deferred = Q.defer();
      test_promises.push(deferred.promise);

      var ca = new (require('../../lib/ca'))();

      var options = {
        hostname: remote,
        port: 10444,
        rejectUnauthorized: false, //true,
        requestCert: true,
        agent: false,
        key: fs.readFileSync(path.join('..', ca.masterApiPrivateKeyFile)),
        cert: fs.readFileSync(path.join('..', ca.masterApiCertFile)),
        ca: [
          fs.readFileSync(path.join('..', cfg.PARTOUT_AGENT_SSL_PUBLIC, 'intermediate_ca.crt')).toString(),
          fs.readFileSync(path.join('..', cfg.PARTOUT_AGENT_SSL_PUBLIC, 'root_ca.crt')).toString()
        ],
        path: '/mocha',
        method: 'POST'
      };

      var req = https.request(options, function (res) {
        var data = '';

        res.on('data', function (chunk) {
          data += chunk;
        });

        res.on('end', function () {
          //console.log('*** res status:', res.statusCode);
          //console.log('*** data:', data);
          var test_result = JSON.parse(data),
              status = (test_result.err ? 'FAILED' : 'OK');

          if (status !== 'OK') {
            console.error('---------------------------------\n' + remote + ' : ' + status + ' : ' + res.statusCode + ' : ' + test_result.time_taken + ' ms');
            console.error(test_result.stdout);

          } else {
            console.info('---------------------------------\n' + remote + ' : ' + status + ' : ' + res.statusCode + ' : ' + test_result.time_taken + ' ms');
          }

          //deferred.resolve(u.format('%s: %s', remote, (test_result.err ? 'failed' : 'ok')));
          deferred.resolve({
            remote: remote,
            result: status,
            test_result: test_result
          });
        });
      });
      //req.setTimeout(500000);
      req.end();

      req.on('error', function (err) {
        console.error('---------------------------------\n' + remote + ' : ' + err.code + ' ERROR\n');
        console.error(err);
        console.error(err.stack);
        deferred.resolve({
            remote: remote,
            result: err.code
          });
      });

      req.on('timeout', function (err) {
        console.error('---------------------------------\n' + remote + ' : ' + err.code + ' TIMEDOUT\n');
        console.error(err);
        console.error(err.stack);
        deferred.resolve({
            remote: remote,
            result: err.code
          });
      });


    });
    deferred.resolve(test_promises);
  });

  return deferred.promise;
};

module.exports = RemoteTests;
