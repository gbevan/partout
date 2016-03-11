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
    _ = require('lodash'),
    utils = new (require('./utils'))(),
    u = require('util');

Q.longStackSupport = true;

/**
 * @class
 * @param {Object} cfg   from partout_agent.conf.js
 * @param {object} https https server
 */
var Master = function (cfg, https) {
  var self = this;
  self.cfg = cfg;
  self.https = https;
  self.app = null;

  self.options = {
    host: cfg.partout_master_hostname,
    port: cfg.partout_master_port,

    rejectUnauthorized: false, //true,
    requestCert: true,
    agent: false,
    ca: [
      fs.readFileSync(path.join(cfg.PARTOUT_AGENT_SSL_PUBLIC, 'intermediate_ca.crt')).toString(),
      fs.readFileSync(path.join(cfg.PARTOUT_AGENT_SSL_PUBLIC, 'root_ca.crt')).toString()
    ]
  };

  self.event_detail_aggregate = {};
};

/*
Master.prototype.set_uuid = function (uuid) {
  var self = this;

  self.uuid = uuid;
}
*/

/**
 * Set the app for this master instance
 * @param {object} app The running app
 */
Master.prototype.set_app = function (app) {
  var self = this;

  self.app = app;
};

/**
 * set the agent certificate and private key (once available)
 * @param {Object} agent's private key
 * @param {Object} agent's cert
 */
Master.prototype.set_agent_cert = function (key, cert) {
  var self = this;
  //console.warn('set_agent_cert');
  self.options.key = key.toString();
  self.options.cert = cert.toString();
  delete self.options.method;

  //self.options.agent = new self.https.Agent(self.options);
};

/**
 * post to master RESTful API, data is returned via either callback or prommise
 * @function
 * @param {String} path of API, e.g. '/event'
 * @param {Object} data to send
 * @param {Function} optional callback, function (err, data)
 * @memberof P2?
 * @returns Promise
 */
Master.prototype.post = function (path, o, cb) {
  utils.dlog('POST: path:', path, 'data:', o, 'type:', typeof(o));
  var self = this,
      deferred = Q.defer(),
      post_data = JSON.stringify(o),
      options = {
        method: 'POST',
        path: path,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(post_data)
        }
      };

  _.merge(options, self.options);
  //console.log('post merged options:', options);

  //debugger;
  var post_req = self.https.request(options, function(res) {
    //console.log('res:', res);
    var data = '';

    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      //console.warn('Response: ' + chunk);
      data += chunk;
    });

    res.on('end', function () {
      //console.log('after on end data:', data);
      if (cb) {
        cb(null, data);
      }
      deferred.resolve(data);
    });
  });

  post_req.on('error', function (err) {
    //throw new Error(err);
    err = new Error(err);
    console.error('POST to master ERROR:', err);
    if (cb) {
      cb(err);
    }
    deferred.reject(err);
  });
  //console.log('post_data:', post_data);
  post_req.write(post_data);
  //console.log('before end()')
  post_req.end();
  //console.log('after end()')

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
  utils.vlog('>>> DEPRECATED >sendevent: data:', u.inspect(o, {colors: true, depth: 2}) + '\nstack:' + (new Error()).stack);
  var self = this;
  //var deferred = Q.defer();

  //deferred.resolve('dummy');
  return self.post('/event', o, cb);
  //return deferred.promise;
};

Master.prototype.send_aggregate_events_and_reset = function (self) {
  //var self = this;

  utils.vlog('send_aggregate_events_and_reset:' + ' now:' + new Date() + ' data:', u.inspect(self.event_detail_aggregate, {colors: true, depth: 6}));

  self.post('/events', self.event_detail_aggregate);

  self.event_detail_aggregate = {};  // Reset for next period of aggregation
};

Master.prototype.qEvent = function (facts, o) {
  var self = this;

  utils.dlog('Master qEvent() o:' + u.inspect(o, {colors: true, depth: 2}));

  if (!o) {
    return;
  }

  if (!facts) {
    utils.vlog('qEvent: data (no facts):', u.inspect(o, {colors: true, depth: 2}));
    return;
  }

  if (!self.event_detail_aggregate.agent) {
    self.event_detail_aggregate.agent = {
      uuid: facts.partout_agent_uuid,
      hostname: facts.os_hostname,
      arch: facts.arch,
      platform: facts.platform,
      os_release: facts.os_release,
      os_family: facts.os_family,
      os_dist_name: facts.os_dist_name,
      os_dist_version_id: facts.os_dist_version_id,
      //count: 0,
      modules: {}
    };

    // start aggregate time interval
    var period = self.app.cfg.partout_agent_throttle.aggregate_period_secs,
        splay = self.app.cfg.partout_agent_throttle.aggregate_period_splay * period,
        rnd = Math.random(),
        rnd_period = (period + (period * splay * rnd) - (0.5 * splay)) * 1000;
    utils.dlog('*** rnd_period:' + rnd_period + ' now:' + new Date());
    setTimeout(self.send_aggregate_events_and_reset, rnd_period, self);
  }

  var o_module = (o && o.module ? o.module : 'unknown');
  if (!self.event_detail_aggregate.agent.modules[o_module]) {
    self.event_detail_aggregate.agent.modules[o_module] = {
      //count: 0,
      objects: {}
    };
  }

  var o_object_b64 = /*new Buffer*/(o && o.object ? o.object : 'unknown')/*.toString('base64')*/;
  if (!self.event_detail_aggregate.agent.modules[o_module][o_object_b64]) {
    self.event_detail_aggregate.agent.modules[o_module][o_object_b64] = {
      //count: 0,
      messages: {}
    };
  }

  var msg_b64 = /*new Buffer*/(
    o && o.msg ? o.msg : 'Internal Agent Error> msg not provided to makeCallbackEvent() - stack:' + (new Error()).stack
  )/*.toString('base64')*/;
  if (!self.event_detail_aggregate.agent.modules[o_module][o_object_b64][msg_b64]) {
    self.event_detail_aggregate.agent.modules[o_module][o_object_b64][msg_b64] = {
      level: ((o.level && o.level.match(/(error|info)/)) ? o.level : 'info'),
      count: 0
    };
  }

  self.event_detail_aggregate.agent.modules[o_module][o_object_b64][msg_b64].count += 1;
};


// TODO: ****** FINISH THIS
/**
 * get from master RESTful API
 * @function
 * @param {String} path of API, e.g. '/event'
 * @param {Object} data to send as query
 * @param {Function} optional callback
 * @memberof P2?
 * @returns Promise
 */
Master.prototype.get = function (path, cb) {
  //console.warn('GET: query:', path);
  var self = this,
    buffer = '',
    deferred = Q.defer(),
    options = {
      path: path,
      method: 'GET'
    },
    msg;
  _.merge(options, self.options);
  //console.log('GET merged options:', options);

  //console.log('before https.get');
  var req = self.https.request(options, function (res) {
    //console.log('after https.get');
    if (res.statusCode === 401) {
      msg = 'Client authentication denied by master (csr may need signing to grant access), status: ' + res.statusCode;
      console.error(msg);
      deferred.reject(new Error(msg));
      return;
    }
    if (res.statusCode !== 200) {
      msg = 'Request failed for path: ' + path + ' status: ' + res.statusCode;
      console.log(msg);
      deferred.reject(new Error(msg));
      return;
    }
    //console.log('res:', res);

    var cert = res.connection.getPeerCertificate();
    //console.log('GET server cert:', cert);

    res.on('data', function (d) {
      buffer += d.toString();
    });
    res.on('end', function () {
      //console.log('full get for:', path, 'buffer:', buffer);
      var data;
      if (res.headers["content-type"].indexOf('application/json') !== -1) {
        data = JSON.parse(buffer);
      } else {
        data = buffer;
      }
      //console.log('is there cert:', cert);
      if (cb) {
        cb(null, data, cert);
      }
      deferred.resolve({data: data, cert: cert});
    });
  });

  req.on('error', function (err) {
    //console.error('GET error:', err);
    if (cb) {
      cb(err, null);
    }
    deferred.reject(err);
  });

  req.end();

  return deferred.promise;
};


module.exports = Master;
