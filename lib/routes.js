/*jslint node: true, vars: true*/
'use strict';

var fs = require('fs'),
  utils = new (require('../agent/lib/utils'))();

var routes = function (r) {

  r.get('/_getManifest', function (req, res, next) {
    utils.hashWalk('etc/manifest', function (manifest) {
      res.send(JSON.stringify(manifest));
    });
  });

  r.get('/_getFile', function (req, res, next) {
    //console.log('req.query:', req.query);
    var f = req.query.file;
    //console.log('reading file:', f);
    fs.readFile(f, function (err, data) {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(data);
      }
    });
  });

};



module.exports = routes;
