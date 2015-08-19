/*jslint node: true, nomen: true, vars: true*/
'use strict';

/*global GLOBAL */

var console = require('better-console'),
  _ = require('lodash'),
  nimble = require('nimble'),
  os = require('os'),
  exec = require('child_process').exec,
  fs = require('fs');
  //_modules = require('./modules');

var P2dummy = function (methods) {
  var self = this;
  self._impl = function _impl() {  };

  _.each(methods, function (m) {
    self[m] = function (args) {
      console.log(m + '(' + (args ? JSON.stringify(args) : '') + '): skipped');
      return self._impl;
    };
    self._impl[m] = self[m];
  });

  self.end = function (args) {
    console.log('end(' + (args ? JSON.stringify(args) : '') + '): skipped');
    return self._impl;
  };
  self._impl.end = self.end;
};

/**
 * Set a watcher on a filesystem object
 * @param file {String} file name / path
 * @param cb {Function} callback(event, filename)
 */
var P2_watch = function (file, cb) {
  console.log('P2_watch() this:', this);
  var self = this;  // is _impl
  fs.watch(file, cb);
};

var P2 = function () {
  var self = this;
  self._impl = function _impl() {  };
  self._impl.end = self.end;
  self._impl.node = self.node;
  self._impl.watch = self.watch;
  self.steps = [];
  self._impl.steps = self.steps;
  self._impl.nodes = [];

  self._impl._watch_state = false;
  self.P2_watch = P2_watch;

  //console.log('P2 this:', this);

  var _modules;

  // Use globally cached facts
  if (GLOBAL.p2 && GLOBAL.p2.facts) {
    self.facts = GLOBAL.p2.facts;
    _modules = require('./modules')();
  } else {
    self.facts = {};
    _modules = require('./modules')(self.facts);
  }
  //console.log('_modules:', _modules);
  //console.log('facts after modules:', self.facts);

  // Link modules
  _.each(Object.keys(_modules), function (m) {
    //console.log('m:', m);
    self[m] = self._impl[m] = _modules[m];
  });

  self.p2Dummy = new P2dummy(Object.keys(_modules));
  //console.log('P2 self:', self);

  return self; //._impl;
};

P2.prototype.end = function (cb) {
  var self = this;
  console.log('end steps:', self.steps);
  nimble.series(self.steps, function () {
    if (cb) {
      cb();
    }
  });
  return self._impl;
};

P2.prototype.node = function (select) {
  var self = this,
    i;
  if (typeof (select) === 'function') {
    if (select(self.facts)) {
      console.log('function returning _impl');
      return self._impl;
    }
    return self.p2Dummy;

  } else if (select instanceof RegExp) {
    console.log('in RegExp:');
    if (os.hostname().match(select)) {
      console.log('RegExp match');
      console.log('RegExp returning _impl:', self._impl);
      return self._impl;
    }

  } else {
    if (typeof (select) === 'string') {
      select = [ select ]; // make array
    }
    self.nodes = self._impl.nodes = select;
    for (i in self.nodes) {
      if (self.nodes.hasOwnProperty(i)) {
        var node = self.nodes[i];
        console.log('node:', node, 'hostname:', os.hostname());
        if (os.hostname() === node) {
          console.log('node match');
          return self._impl;
        }
      }
    }
  }
  console.log('node no match');
  //process.exit(0);
  //return null;
  return self.p2Dummy;
};
P2.prototype.select = P2.prototype.node;  // alias of node

P2.prototype.watch = function (state) {
  var self = this;  // self is _impl
  console.log('>>>>>>> in file watch state (parse phase):', state, 'self:', self);
  self._watch_state = state;

  return self;
};


module.exports = P2;
