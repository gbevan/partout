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

  r.get('/', function (req, res, next) {
    res.status(200).send('HELLO\n\n');
  });
};

module.exports = routes;
