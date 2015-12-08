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
  fs = require('fs'),
  path = require('path'),
  utils = new (require('../../agent/lib/utils'))(),
  Mustache = require('mustache');

/**
 * Define RESTful API routes
 * @constructor
 *
 */
// FIXME: mock = true bypasses client certificate tests for mock up unit tests
var routes = function (r, cfg, db, controllers) {
  var self = this;

  //console.log('cfg:', cfg);

  function requestClientCertAuthorized (req, res, next) {
    if (!req.client.authorized && !r.mock) {
      res.status(401).send('denied');
      return;
    }
    next();
  }

  function getRemoteIP (req) {
    return req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
  }

  /**
   * RESTful API agentcsr - allow agents to send their certificate signing
   * requests.
   */
  r.post('/agentcsr', function (req, res, next) {
    console.warn('Agent CSR received: req.body.csr:', req.body.csr);
    console.warn('req:', req);

    var ip = getRemoteIP(req),
      csr = req.body.csr;

    controllers.csr.register(ip, csr)
    .then(function (status) {
      console.log('status:', status);
      res.status(200).json({status: status});
    });
  });

  /**
   * RESTful API manifest - walk manifest on server
   * @return {object} manifest of files and sha512 hashes
   */
  r.get('/manifest', requestClientCertAuthorized, function (req, res, next) {
    console.log('req.client authorized:', req.client.authorized);
    utils.hashWalk('etc/manifest', function (manifest) {
      res.json(manifest);
    });
  });

  /**
   * RESTful API file - return a file's contents
   * @param {String} file file to be returned
   * @return {String} file contents
   */
  r.get('/file', function (req, res, next) {
    var f = req.query.file,
      re = new RegExp('(^|[\\/])\\.\\.[\\/]');
    console.log('req.client authorized:', req.client.authorized);

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

    // TODO: Authorise manifest access using signed client cert

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
   * @param {String} Module name
   * @param {String} Message
   * @param {String} Object description
   * @return {object} 'received'
   */
  r.post('/event', function (req, res, next) {
    //console.log('body:', req.body);
    console.warn(req.connection.remoteAddress + '> [' + req.body.object + ':' + req.body.module + '] - ' + req.body.msg.trim());
    res.status(200).send('received');
  });

  /**
   * RESTful API facts - allow agents to send their discovered facts
   * @param {Object} JSON object of facts
   * @return {Object} 'received'
   */
  r.post('/facts', function (req, res, next) {
    console.log('facts posted:', req.body);
    res.status(200).send('received');
  });

  /**
   * RESTful API nodejsManifest - walk node manifest on server for
   * a given OS and arch.
   * @param {String} Operating system, e.g. linux
   * @param {String} Architecture, e.g. x64.
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

    utils.hashWalk(path.join('node', os, arch), function (manifest) {
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
   * @return {object} manifest of files and sha512 hashes
   */
  r.get('/agentManifest', function (req, res, next) {
    var test = (req.query.test === '1'),
      bootstrap = req.query.bootstrap;
    utils.hashWalk('agent/' + (test ? 'app.js' : ''), /^agent\/etc\//, function (manifest) {
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
    });
  });

  /**
   * bootstrap agent to a client
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

module.exports = routes;
