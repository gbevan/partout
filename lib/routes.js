/*jslint node: true, vars: true*/
'use strict';

var console = require('better-console'),
  fs = require('fs'),
  utils = new (require('../agent/lib/utils'))();

/**
 * Define RESTful API routes
 * @constructor
 */
var routes = function (r) {
  var self = this;

  /**
   * RESTful API _getManifest - walk manifest on server
   * @return {object} manifest of files and sha512 hashes
   */
  var _getManifest = function (req, res, next) {
    utils.hashWalk('etc/manifest', function (manifest) {
      res.send(JSON.stringify(manifest));
    });
  };
  r.get('/_getManifest', _getManifest);

  /**
   * RESTful API _getFile - return a file's contents
   * @param {String} file file to be returned
   * @return {String} file contents
   */
  var _getFile = function (req, res, next) {
    //console.log('req.query:', req.query);
    var f = req.query.file;
    // TODO: Filter security violations
    //console.log('reading file:', f);
    fs.readFile(f, function (err, data) {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(data);
      }
    });
  };
  r.get('/_getFile', _getFile);

  /**
   * RESTful API _event - allow agents to send events to the master
   */
  var _event = function (req, res, next) {
    console.warn(req.connection.remoteAddress + '> [' + req.body.module + '] - ' + req.body.msg + ' (object=' + req.body.object + ')');
    res.status(200).send('received');
  };
  r.post('/_event', _event);

};

module.exports = routes;
