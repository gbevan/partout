/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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
    fs = require('fs'),
    path = require('path'),
    pfs = new (require('../../agent/lib/pfs'))(),
    Mustache = require('mustache'),
    Q = require('q'),
    express = require('express'),
    os = require('os'),
    utils = new (require('../../agent/lib/utils'))(),
    u = require('util'),
    _ = require('lodash');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

/**
 * Define RESTful API routes
 * @constructor
 *
 */
// FIXME: mock = true bypasses client certificate tests for mock up unit tests
var routesApi = function (r, cfg, db, controllers, serverMetrics) {
  var self = this;

  //console.log('cfg:', cfg);

  /**
   * Validate a client request is authorised
   * @param {object}   req  Request
   * @param {object}   res  Result
   * @param {function} next Callback
   */
  function requestClientCertAuthorized (req, res, next) {
    //console.log('r.mock:', r.mock);
    //console.log('req.client:', req.client);
    //console.log('requestClientCertAuthorized req.client authorized:', req.client.authorized);
    if (!req.client.authorized && !r.mock) {
      res.status(401).send('denied: ' + req.client.authorizationError + '\n\r');
      return;
    }
    next();
  }

  /**
   * Get remote IP address from client request
   * @param   {object} req Request
   * @returns {string} IP address
   */
  function getRemoteIP (req) {
    return req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
  }

  /**
   * Show default home page for browsers
   * @memberof routesApi
   * @function
   * @name RESTful /
   */
  r.get('/', function (req, res, next) {
    Q.nfcall(fs.readFile, path.join(__dirname, '../../public/views/index.html'))
    .then(function (template) {
      var page = Mustache.render(
        template.toString(), {
          master_hostname: cfg.partout_master_hostname,
          master_api_port: cfg.partout_api_port,
          banner: utils.getBanner(),
          role: 'Master API'
        }
      );
      res.set('Content-Type', 'text/html');
      res.send(page);
      //res.sendFile(path.join(__dirname, '../../public/views/index.html'));
    })
    .fail(function (err) {
      console.error(err);
      res.status(500).send(err);
    })
    .done();
  });

  /**
   * RESTful API agentcsr - allow agents to send their certificate signing
   * requests.  Agent continues to submit it's CSR until until it is signed.
   * The POST request returns the current status, and once signed, also
   * returns the Agent's signed certificate.
   * @memberof routesApi
   * @function
   * @name RESTful /agentcsr
   */
  r.post('/agentcsr', function (req, res, next) {
    //console.warn('Agent CSR received: req.body.csr:', req.body.csr);
    //console.warn('req:', req);

    var ip = getRemoteIP(req),
      uuid = req.body.uuid,
      env = req.body.env,
      csr = req.body.csr;

    controllers.csr.register(uuid, ip, csr, env)
    .then(function (doc) {
      console.log('csr doc:', doc);
      res.status(200).json(doc);

      if (doc.status === 'signed') {
        // Create Agent
        controllers.agent.upsert({
          _key: doc._key,
          ip: doc.ip
        })
        .then(function () {
          // cleanup
          console.log('deleting csr');
          controllers.csr.delete(doc._key);
        })
        .done();
      }
    })
    .done();
  });

  /**
   * RESTful API manifest - walk manifest on server
   * @memberof routesApi
   * @function
   * @name RESTful /manifest
   * @return {object} manifest of files and sha512 hashes
   */
  r.get('/manifest', requestClientCertAuthorized, function (req, res, next) {
    console.log('manifest: req: query:', req.query);
    var environment = req.query.environment,
        envRe = new RegExp(u.format('^(etc/manifest/(roles|%s)/)', environment)),
        excludeRe = new RegExp(/\/\.git\//);

    pfs.hashWalk('etc/manifest', function (manifest) {
      var env_manifest = {};
      //console.log('manifest:', manifest);

      _.each(manifest, function (v, k) {

        if (k.match(excludeRe)) {
          return;
        }

        if (k.match(envRe)) {
          env_manifest[k] = v;
        }
      });

      res.json(env_manifest);

    });
  });

  /**
   * RESTful API file - return a file's contents
   * @memberof routesApi
   * @function
   * @name RESTful /file
   * @param {String} file file to be returned
   * @return {String} file contents
   */
  r.get('/file', function (req, res, next) {
    var f = req.query.file,
      re = new RegExp('(^|[\\/])\\.\\.[\\/]');

    if (!f.match(/^(etc\/manifest|node|agent)\//) || f.match(re)) {
      console.error(req.connection.remoteAddress + '> BLOCKED: SECURITY VIOLATION ATTEMPT to access file:', f);
      res.status(403).send();
      return;
    }

    // check authorised for manifests
    if (f.match(/^etc\/manifest\//) && !req.client.authorized && !r.mock) {
      console.error('Unauthorised client attempt to access manifests - denied');
      res.status(401).send('denied');
      return;
    }

    // TODO: Authorise manifest access using signed client cert

    fs.readFile(f, function (err, data) {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(data);
      }
    });
  });

  /**
   * RESTful API fileAttrs - return a file's attributes
   * @memberof routesApi
   * @function
   * @name RESTful /fileAttrs
   * @param {String} file file to be returned
   * @return {Object} {mode: 0777, etc}
   */
  r.get('/fileAttrs', function (req, res, next) {
    var f = req.query.file,
      re = new RegExp('(^|[\\/])\\.\\.[\\/]'),
      bootstrap = req.query.bootstrap;

    // TODO: common code with /file
    if (!f.match(/^(etc\/manifest|node|agent)\//) || f.match(re)) {
      console.error(req.connection.remoteAddress + '> BLOCKED: SECURITY VIOLATION ATTEMPT to access attributes for file:', f);
      res.status(403).send();
      return;
    }

    // check authorised for manifests
    if (f.match(/^etc\/manifest\//) && !req.client.authorized && !r.mock) {
      console.error('Unauthorised client attempt to access manifests - denied');
      res.status(401).send('denied');
      return;
    }

    fs.stat(f, function (err, stat) {
      if (err) {
        res.status(404).send(err);
      } else {
        if (bootstrap) {
          res.type('application/octet-stream').send('0' + stat.mode.toString(8) + '\n');
        } else {
          res.json(stat);
        }
      }
    });
  });

  /**
   * RESTful API event - allow agents to send events to the master
   * Called by utils.callbackEvent()
   *
   * @memberof routesApi
   * @function
   * @name RESTful /event
   * @param {String} object object description
   * @param {String} module Module name
   * @param {String} msg Message
   * @return {object} 'received'
   */
  r.post('/event', function (req, res, next) {
    //console.log('body:', req.body);
    var e = req.body;
    console.warn(
      req.connection.remoteAddress +
      (e.hostname ? '|' + e.hostname : '') +
      (e.agent_uuid ? '|' + e.agent_uuid : '') +
      '> [' +
      req.body.module.toLowerCase() +
      ':' +
      req.body.object +
      '] - ' +
      req.body.msg.trim()
    );
    res.status(200).send('received');
  });

  /**
   * RESTful API events - allow agents to send their aggregated events to the master
   * Called by Master.send_aggregate_events_and_reset()
   *
   * @memberof routesApi
   * @function
   * @name RESTful /events
   * @param {String} object Event detail aggregate object
   * @return {object} with dynamic agent throttle settings
   */
  r.post('/events', function (req, res, next) {
    //console.log('/events: body:', req.body);

    function calc_level() {
      var Em = serverMetrics.getWeightedEventRatePerMin(),
          Ps = Em / cfg.event_rate_divisor,
          level = 4;

      console.log('/events calc_level: Em:', Em, 'Ps:', Ps);
      //console.log('cfg:', cfg);
      Ps = (isNaN(Ps) ? cfg.aggregate_collection_period_secs_min : Ps);

      console.log('/events calc_level: Em:', Em, 'Ps:', Ps);

      Ps = (Ps > cfg.aggregate_collection_period_secs_min ? Ps : cfg.aggregate_collection_period_secs_min); // floor
      Ps = (Ps < cfg.aggregate_collection_period_secs_max ? Ps : cfg.aggregate_collection_period_secs_max); // ceil

      if (Ps >= cfg.aggregate_collection_period_secs_max) {
        if (Em < cfg.em_threshold_obj) {
          level = 4;
        } else if (Em < cfg.em_threshold_mod) {
          level = 3;
        } else if (Em < cfg.em_threshold_uuid) {
          level = 2;
        } else {
          level = 1;
        }
      }

      console.log('/events calc_level: Ps:', Ps, 'level:', level);

      return {Ps: Ps, level: level};
    }

    serverMetrics.incEventCount();

    var e = req.body;
    console.warn(
      req.connection.remoteAddress +
      (e.agent.hostname ? '|' + e.agent.hostname : '') +
      (e.agent.uuid ? '|' + e.agent.uuid : '') +
      '> ' + u.inspect(e, {color: true, depth: 7})
    );

    var d = calc_level();

    res.status(200).json({
      // TODO: Calculate these:
      aggregate_period_secs: d.Ps,
      aggregate_period_splay: 0.05,
      aggregate_level: d.level,
      notify_alive_period_secs: 60 * 60 * 24
    });
  });

  /**
   * RESTful API facts - allow agents to send their discovered facts
   * @memberof routesApi
   * @function
   * @name RESTful /facts
   * @param {Object} JSON object of facts
   * @return {Object} 'received'
   */
  r.post('/facts', requestClientCertAuthorized, function (req, res, next) {
    //console.log('facts posted:', req.body);
    var partout_agent_uuid = req.body.partout_agent_uuid,
        now = new Date(),
        ip = getRemoteIP(req);

    if (!partout_agent_uuid || partout_agent_uuid === '') {
      res.status(400).send('partout_agent_uuid not sent');
      return;
    }

    controllers.agent.queryOne({_key: partout_agent_uuid})
    .then(function (doc) {
      var agent_deferred = Q.defer();

      // create doc if it doesnt yet exist
      if (!doc) {
        controllers.agent.upsert({
          _key: partout_agent_uuid,
          ip: ip
        })
        .then(function (doc) {
          console.log('/facts after agent upsert, doc:', doc);
          agent_deferred.resolve(doc);
        })
        .done();
      } else {
        agent_deferred.resolve(doc);
      }

      agent_deferred
      .promise
      .then(function (doc) {

        //console.log('doc in routes:', doc);
        doc.facts = req.body;
        doc.lastSeen = now;
        doc.ip = ip;

        //console.warn('facts from doc:', doc.facts);
        controllers.agent.update(doc)
        .then(function () {
          res.status(200).send('received');
        })
        .fail(function (err) {
          console.error('err #1:', err);
          res.status(500).send(err.code);
        })
        .done();
      });

    })
    .fail(function (err) {
      console.error('err #2:', err);
      res.status(500).send(err.code);
    })
    .done();
  });

  /**
   * RESTful API nodejsManifest - walk node manifest on server for
   * a given OS and arch.
   * @memberof routesApi
   * @function
   * @name RESTful /nodejsManifest
   * @param {String} Operating system, e.g. linux
   * @param {String} Architecture e.g. x64.
   * @return {object} manifest of files and sha512 hashes
   */
  r.get('/nodejsManifest', function (req, res, next) {
    var os = req.query.os.toLowerCase(),
      arch = req.query.arch.toLowerCase(),
      bootstrap = req.query.bootstrap;
    //console.log('req:', req);

    if (arch === 'x86_64') {
      arch = 'x64';
    }

    if (!os) {
      res.status(400).send('os parameter missing\n\r');
      return;
    }

    if (!arch) {
      res.status(400).send('arch parameter missing\n\r');
      return;
    }

    pfs.hashWalk(path.join('node', os, arch), function (manifest) {
      if (bootstrap) {
        // return just text list of files
        //console.log('manifest:', manifest);
        var resp = '';
        for (var e in manifest) {
          resp += e + '\n';
        }
        //console.log('resp:', resp);
        res.type('application/octet-stream').send(resp);
      } else {
        res.json(manifest);
      }
    });
  });

  /**
   * RESTful API agentManifest - walk agent manifest on server.
   * @memberof routesApi
   * @function
   * @name RESTful /agentManifest
   * @return {object} manifest of files and sha512 hashes
   */
  r.get('/agentManifest', function (req, res, next) {
    var test = (req.query.test === '1'),
      bootstrap = req.query.bootstrap;
    pfs.hashWalk(
      'agent/' + (test ? 'app.js' : ''),
      /^agent\/(etc\/(manifest\/|ssl\/|ssl-test\/|test_policies\/|UUID)|\.vagrant|jsdocs)/,
      function (manifest) {

        if (bootstrap) {
          // return just text list of files
          var resp = '';
          for (var e in manifest) {
            resp += e + '\n';
          }
          //console.log('resp:', resp);
          res.type('application/octet-stream').send(resp);
        } else {
          res.json(manifest);
        }
      }
    );
  });

  /**
   * bootstrap agent to a client
   * @memberof routesApi
   * @function
   * @name RESTful /bootstrap
   * @return {String} bootstrap script
   */
  r.get('/bootstrap', function (req, res, next) {
    var suffix = (req.query.os.match(/(windows)/) ? 'ps1' : 'sh'),
      f = 'bin/bootstrap.' + suffix;

    console.warn('Client requests bootrapping, providing "' + f + '"');

    fs.readFile(f, function (err, data) {
      if (err) {
        res.status(404).send(err);
      } else {
        // Resolve template fields
        data = data.toString();
        console.log('data:', data);
        data = Mustache.render(data, cfg);
        res.send(data);
      }
    });

  });

};

module.exports = routesApi;
