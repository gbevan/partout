/*jslint node: true, nomen: true */
'use strict';

var _ = require('lodash'),
  nimble = require('nimble'),
  os = require('os'),
  exec = require('child_process').exec,
  _modules = require('./modules');

var P2 = function () {
  var self = this;
  self._impl = function _impl() {  };
  self._impl.end = self.end;
  self._steps = [];
  self._impl._steps = self._steps;
  self._impl.nodes = [];

  // Link modules
  _.each(Object.keys(_modules), function (m) {
    self[m] = self._impl[m] = _modules[m];
  });
};

P2.prototype.end = function (cb) {
  var self = this;
  nimble.series(self._steps, function () {
    if (cb) {
      cb();
    }
  });
  return self._impl;
};

P2.prototype.node = function (hostOrList) {
  var self = this;
  if (typeof (hostOrList) === 'string') {
    hostOrList = [ hostOrList ]; // make array
  }
  self.nodes = self._impl.nodes = hostOrList;
  return self._impl;
};

module.exports = P2;
