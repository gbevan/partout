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

/*jslint node: true */
'use strict';

var path = require('path'),
  fs = require('fs'),
  //querystring = require('querystring'),
  Q = require('q'),
  _ = require('lodash');

Q.longStackSupport = true;

/**
 * @constuctor
 * @param {Object} cfg from partout_agent.conf.js
 * @param {Object} instance of https from app
 */
var Master = function (cfg, https) {
  var self = this;
  self.cfg = cfg;
  self.https = https;

  self.options = {
    host: cfg.partout_master_hostname, // TODO: param'ize
    port: cfg.partout_master_port,

    method: 'POST',
    rejectUnauthorized: true,
    requestCert: true,
    agent: false,
    /*
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    },
    */
    ca: [
      fs.readFileSync(path.join(cfg.PARTOUT_AGENT_SSL_PUBLIC, 'root_ca.crt')).toString(),
      fs.readFileSync(path.join(cfg.PARTOUT_AGENT_SSL_PUBLIC, 'intermediate_ca.crt')).toString()
    ]
    //checkServerIdentity: function (servername, cert) {
    //  console.log('servername:', servername, 'cert:', cert);
    //  return undefined; // or err
    //}
  };
};

/**
 * post to master RESTful API
 * @function
 * @param {String} path of API, e.g. '/event'
 * @param {Object} data to send
 * @param {Function} optional callback
 * @memberof P2?
 * @returns Promise
 */
Master.prototype.post = function (path, o, cb) {
  console.warn('sendevent: msg:', o.msg);
  var self = this;

  var deferred = Q.defer();

  var post_data = JSON.stringify(o),
    options = {
      path: path,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
      }
    };
  options = _.merge(self.options, options);
  console.log('post merged options:', options);

  //options.agent = new https.Agent(options);

  var post_req = self.https.request(options, function(res) {
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

  console.log('post_data:', post_data);
  post_req.write(post_data);
  post_req.end();

  post_req.on('error', function (err) {
    console.error(err);
    deferred.reject(new Error(err));
  });

  return deferred.promise;
};

/**
 * send event to master
 * @function
 * @param {Object} - {
 *    module: 'file',
 *    object: filename,
 *    msg: string of actions taken
 *  }
 * @param {Function} optional callback
 * @memberof P2
 * @returns Promise
 */
Master.prototype.sendevent = function (o, cb) {
  var self = this;

  return self.post('/event', o, cb);
};


module.exports = Master;
