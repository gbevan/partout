/*jslint node: true, vars: true*/
'use strict';

var console = require('better-console'),
  fs = require('fs'),
  utils = new (require('../../agent/lib/utils'))();

/**
 * Define RESTful API routes
 * @constructor
 */
var routes = function (r) {
  var self = this;

  /**
   * RESTful API manifest - walk manifest on server
   * @return {object} manifest of files and sha512 hashes
   */
  r.get('/manifest', function (req, res, next) {
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
      re = new RegExp('(^|[\\/])\.\.[\\/]');
    // FIXME: Filter security violations!!!

    if (!f.match(/^(etc\/manifest)\//) || f.match(re)) {
      console.error(req.connection.remoteAddress + '> SECURITY VIOLATION ATTEMPT to access file:', f);
      res.status(403).send();
      return;
    }

    fs.readFile(f, function (err, data) {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(data);
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
    console.warn(req.connection.remoteAddress + '> [' + req.body.module + '] - ' + req.body.msg.trim() + ' (object=' + req.body.object + ')');
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

};

module.exports = routes;
