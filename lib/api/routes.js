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

const console = require('better-console'),
      fs = require('fs'),
      path = require('path'),
      pfs = require('../../agent/lib/pfs'),
      Mustache = require('mustache'),
      Q = require('q'),
      express = require('express'),
      os = require('os'),
      utils = require('../../agent/lib/utils'),
      u = require('util'),
      _ = require('lodash'),
      debug = require('debug')('partout:api:routes');

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
var routesApi = function (r, cfg, app, appUi, serverMetrics) {
  var self = this;

  //console.log('cfg:', cfg);
//  console.warn('appUi:', appUi);

  /**
   * Validate a client request is authorised
   * @param {object}   req  Request
   * @param {object}   res  Result
   * @param {function} next Callback
   */
  function requestClientCertAuthorized (req, res, next) {
    if (!req.client.authorized && !r.mock) {
      const err = 'denied: ' + req.client.authorizationError + '\n\r';
      res.status(401).send(err);
      appUi.app.report_issue(new Error(err));
      return;
    }
    next();
  }

  /**
   * Resolve Agent from the cert's subject GivenName - uuid
   * @param {object}   req  Request
   * @param {object}   res  Result
   * @param {function} next Callback
   */
  function resolveAgent (req, res, next) {
    //console.log('resolveAgent from:', (new Error('resolveAgent')).stack);
    //console.log('req.connection:', req.connection);
    debug('resolveAgent req.connection:', req.connection);
    var cert;

    if (req.connection) {
      cert = req.connection.getPeerCertificate();
    }
    debug('peer cert:', cert);

    if (!cert || !cert.subject || !cert.subject.GN) {
      debug('no cert/subject');
      req.agent = undefined;
      return next();
    }

    // Get agent for cert uuid and add to req
//    controllers.agent.queryOne({_key: cert.subject.GN})
//    console.log('services.agents:', app.services.agents);
    appUi.app.service('agents').get(cert.subject.GN, {})
    .then(function (doc) {
      debug('resolveAgent() get agent:', doc);
      if (doc) {
        req.agent = doc;
      } else {
        req.agent = undefined;
      }
      next();
    })
    .catch((err) => {
      console.error('resolveAgent() err:', err);
      res.status(500).send(err);
      appUi.app.report_issue(err);
    });

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
      appUi.app.report_issue(err);
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
//        env = req.body.env,
        csr = req.body.csr;
    console.info('Agent CSR received req.body:', req.body);

//    controllers.csr.register(uuid, ip, csr, env)
    appUi.app.service('csrs')
    .register(uuid, ip, csr)
    .then(function (doc) {
      //console.log('csr doc:', doc);

      if (doc.status === 'signed') {
        // get Cert from signed csr
        var cert = doc.cert;

        // Get default environment
        return appUi.app.service('environments')
        .find({ query: { name: cfg.DEFAULT_ENVIRONMENT }})
        .then((env_res) => {
          if (env_res.total === 0) {
            res.statusMessage = 'default environment not found';
            appUi.app.report_issue(new Error(res.statusMessage));
            return res.status(500).end();

          } else if (env_res.total > 1) {
            res.statusMessage = '>1 entries returned for default environment';
            appUi.app.report_issue(new Error(res.statusMessage));
            return res.status(500).end();
          }

          const env = env_res.data[0];

          //////////////////
          // Create Agent
          console.log('agentcsr cert:', cert);
  //        controllers.agent.upsert({
          return appUi.app.service('agents').create({
            id: doc.id,
            ip: doc.ip,
            environment: env.id,
            certInfo: (cert ? {
              subject: cert.subject,
              issuer: cert.issuer,
              valid_from: cert.validity.notBefore,
              valid_to: cert.validity.notAfter,
              //fingerprint: cert.fingerprint,
              serialNumber: cert.serialNumber
            } : {})
          })
          .then(function () {
            // cleanup
            console.log('deleting csr');
  //          controllers.csr.delete(doc._key);
            appUi.app.service('csrs').remove(doc.id);

            // Tell the agent it's csr is signed
            res.status(200).json({
              uuid: doc.id,
              certPem: doc.certPem,
              status: doc.status
            });

//          })
//          .catch((err) => {
//            console.error('agent create err:', err);
          });
        });
      } else {
        res.status(200).json({
          uuid: doc.id,
          certPem: doc.certPem,
          status: doc.status
        });
      }
    })
    .catch((err) => {
      console.error('agent register err:', err);
      res.statusMessage = `agent register err: ${err.message}`;
      appUi.app.report_issue(err);
      return res.status(500).end();
    });
  });

  /**
   * RESTful API manifest - walk manifest on server
   * @memberof routesApi
   * @function
   * @name RESTful /manifest
   * @return {object} manifest of files and sha512 hashes
   */
  r.get('/manifest', requestClientCertAuthorized, resolveAgent, function (req, res, next) {
    //console.log('manifest: req: query:', req.query);
    //console.log('cert:', req.connection.getPeerCertificate());
    //console.log('req.agent:', req.agent);
    if (!req.agent) {
      res.status(400).send(new Error('Agent is undefined'));
      return;
    }

    // don't trust agent.environment from browser, get from db instead
    appUi.app.service('agents').get(req.agent.id, {})
    .then((agent) => {

      if (!agent.environment || !agent.environment.name) {
        return res.status(200).json({});
      }

      var environment = agent.environment.name,
          envRe = new RegExp(u.format('^(%s/(roles|%s)/)', cfg.MANIFESTDIR, environment)),
          excludeRe = new RegExp(/\/\.git\//);

      //console.log('before hashWalk');
      pfs.hashWalk(cfg.MANIFESTDIR, function (manifest) {
        var env_manifest = {};
        //console.log('manifest:', manifest);

        _.each(manifest, function (v, k) {

          if (k.match(excludeRe)) {
            return;
          }

          if (k.match(envRe)) {
            // Remove environment root folder from relname
  //          var relnameRe = new RegExp(u.format('^%s%s', environment, path.sep));
  //          v.relname = v.relname.replace(relnameRe, '');
  //          console.log('relname:', v.relname);
            env_manifest[k] = v;
          }
        });

        //console.log('env_manifest:', env_manifest);
        res.status(200).json({
          environment: environment,
          manifest: env_manifest
        });

      });
    })
    .catch((err) => {
      console.error('/manifest get agent err:', err);
      res.status(500);
      appUi.app.report_issue(err);
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
  r.get('/file', resolveAgent, function (req, res, next) {
    var f = req.query.file,
        re = new RegExp('(^|[\\/])\\.\\.[\\/]'),
        matchRe = new RegExp(u.format('^(%s|node|agent)/', cfg.MANIFESTDIR)),
        matchAuthRe = new RegExp(u.format('^%s/', cfg.MANIFESTDIR));

    //console.log('req.agent:', req.agent);
    if (!req.agent) {
      res.status(500).send(new Error('Agent is undefined'));
      return;
    }

    appUi.app.service('agents').get(req.agent.id, {})
    .then((agent) => {

      if (!agent.environment || !agent.environment.name) {
        return res.status(403).json({});
      }

      if (!f.match(matchRe) || f.match(re)) {
        console.error(req.connection.remoteAddress + '> BLOCKED: SECURITY VIOLATION ATTEMPT to access file:', f);
        res.status(403).send();
        return;
      }

      // check authorised for manifests
      if (f.match(matchAuthRe)) {
        if (!req.client.authorized && !r.mock) {
          console.error('Unauthorised client attempt to access manifests - denied');
          res.status(401).send('denied');
          return;
        }

        // Request can only be for the agent's registered environment
        var envRe = new RegExp(u.format('^%s/%s\/', cfg.MANIFESTDIR, agent.environment.name));
        if (!f.match(envRe)) {
          console.error('Agent requested manifest for other environment:', f);
          res.status(401).send('denied');
          return;
        }
      }

      var rstream = fs.createReadStream(f, {encoding: 'base64'});
      res.status(200);
      res.set('Content-Type', 'application/octet-stream');

      rstream.on('data', function (b64) {
        res.write(b64);
      });

      rstream.on('close', function () {
        res.end();
      });

    })
    .catch((err) => {
      console.error('/file get agent err:', err);
      res.status(500);
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
  r.get('/fileAttrs', resolveAgent, function (req, res, next) {
    var f = req.query.file,
        re = new RegExp('(^|[\\/])\\.\\.[\\/]'),
        matchRe = new RegExp(u.format('^(%s|node|agent)/', cfg.MANIFESTDIR)),
        matchAuthRe = new RegExp(u.format('^%s/', cfg.MANIFESTDIR)),
        bootstrap = req.query.bootstrap;

    appUi.app.service('agents').get(req.agent.id, {})
    .then((agent) => {

      if (!agent.environment || !agent.environment.name) {
        return res.status(403).json({});
      }

      // TODO: common code with /file
      if (!f.match(matchRe) || f.match(re)) {
        console.error(req.connection.remoteAddress + '> BLOCKED: SECURITY VIOLATION ATTEMPT to access attributes for file:', f);
        res.status(403).send();
        return;
      }

      // check authorised for manifests
      if (f.match(matchAuthRe)) {
        if (!req.client.authorized && !r.mock) {
          console.error('Unauthorised client attempt to access manifests - denied');
          res.status(401).send('denied');
          return;
        }

        // Request can only be for the agent's registered environment
        var envRe = new RegExp(u.format('^%s/%s\/', cfg.MANIFESTDIR, agent.environment.name));
        if (!f.match(envRe)) {
          console.error('Agent requested manifest for other environment:', f);
          res.status(401).send('denied');
          return;
        }
      }

      fs.stat(f, function (err, stat) {
        if (err) {
          res.status(404).send(err);
        } else {
          if (bootstrap) {
            res
            .type('application/octet-stream')
            .status(200)
            .send('0' + stat.mode.toString(8) + '\n');
          } else {
            res
            .status(200)
            .json(stat);
          }
        }
      });

    })
    .catch((err) => {
      console.error('/file get agent err:', err);
      res.status(500);
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
  r.post('/event', resolveAgent, requestClientCertAuthorized, function (req, res, next) {
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
  r.post('/events', resolveAgent, requestClientCertAuthorized, function (req, res, next) { // TODO: , resolveAgent ??
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
  r.post('/facts', resolveAgent, requestClientCertAuthorized, function (req, res, next) {
    debug('facts posted:', req.body.os_hostname);
    //var partout_agent_uuid = req.body.partout_agent_uuid,
    var partout_agent_uuid = req.agent.id,
        now = new Date(),
        ip = getRemoteIP(req);

    debug('/facts posted for agent:', partout_agent_uuid, ip);

    if (!partout_agent_uuid || partout_agent_uuid === '') {
      res.status(400).send('partout_agent_uuid not sent');
      return;
    }

//    controllers.agent.queryOne({_key: partout_agent_uuid})
    appUi.app.service('agents').get(partout_agent_uuid, {})
    .then((doc) => {
      var agent_deferred = Q.defer();

      // create doc if it doesnt yet exist
      if (!doc) {
//        controllers.agent.upsert({
        appUi.app.service('agents')
        .create({
          _key: partout_agent_uuid,
          ip: ip
        })
        .then(function (doc) {
          console.log('/facts after agent create, doc:', doc);
          agent_deferred.resolve(doc);
        })
        .catch((err) => {
          console.error('facts: create agent err:', err);
          agent_deferred.reject(err);
        });
      } else {
        agent_deferred.resolve(doc);
      }

      agent_deferred
      .promise
      .then(function (doc) {

        //console.log('doc in routes:', doc);
        doc.facts = req.body;
        console.log('captured netdep:', doc.facts.captured.netDep['9']);
        doc.lastSeen = now;
        doc.ip = ip;

        // Cherrypick facts for top level
        doc.platform = doc.facts.platform || 'unknown';
        doc.os_family = doc.facts.os_family || 'unknown';
        doc.os_dist_name = doc.facts.os_dist_name || 'unknown';
        doc.os_dist_version_id = doc.facts.os_dist_version_id || '';
        doc.os_release = doc.facts.os_release || '';
        doc.os_hostname = doc.facts.os_hostname || '';
        doc.os_arch = doc.facts.os_arch || '';

        //console.warn('facts from doc:', doc.facts);
        debug('updating with doc:', doc);
//        controllers.agent.update(doc)
        appUi.app.service('agents')
//        .patch(partout_agent_uuid, doc)
        .update(partout_agent_uuid, doc, {query: {
//          id: partout_agent_uuid,
          $replace: true
        }})
        .then((newdoc) => {
//          console.log('newdoc netdep:', newdoc.facts.captured.netDep['9']);
          debug('updated agent uuid:', partout_agent_uuid, 'newdoc:', newdoc);
          res.status(200).send('received');
        })
        .catch((err) => {
          console.error('err #1:', err);
          res.status(500).send(err.code);
        });
      })
      .done(null, (err) => {
          res.status(500).send(err.code);
      });

    })
    .catch((err) => {
      console.error('err #2:', err);
      res.status(500).send(err.code);
    });
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
