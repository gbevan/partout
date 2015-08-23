/*jslint node: true, nomen: true, vars: true*/
'use strict';

/*global GLOBAL */

var console = require('better-console'),
  _ = require('lodash'),
  nimble = require('nimble'),
  os = require('os'),
  exec = require('child_process').exec,
  fs = require('fs'),
  EventEmitter = require('events').EventEmitter,
  querystring = require('querystring');

var init_impl = function _impl() {  };

/**
 * Set a watcher on a filesystem object
 * @param file {String} file name / path
 * @param cb {Function} callback(event, filename)
 */
var P2_watch = function (file, cb) {
  console.log('P2_watch() this:', this);
  var self = this;  // is _impl

  function queue_event (event, filename) {
    console.log('queue_event() event:', event, 'filename:', filename);
    var qlen = self._watch_event_cb_list.length;
    //self._watch_event_cb_list.push(cb);
    self._watch_event_cb_list.push(function (nimblecb) {
      cb(function (o) {
        console.log('o:', o);
        if (o.msg && o.msg.length > 0) {
          self.sendevent(o);
        }
        nimblecb();
      });
    });
    if (qlen === 0) {
      /*
       * delay briefly to allow any small bursts of related events to be queued
       */
      setTimeout(function () {
        self._watch_trigger_listener.emit('run');
      }, 10);
    }
  }

  // NOTE: _watchers are closed in P2_watchers_close() below
  self._watchers[file] = fs.watch(file, {persistent: false}, queue_event);
};

var P2_unwatch = function (file) {
  var self = this;  // is _impl
  if (self._watchers[file]) {
    self._watchers[file].close();
    delete self._watchers[file];
  }
};

var P2_watchers_close = function () {
  var self = this,  // is _impl
    i;
  for (i in self._watchers) {
    if (self._watchers.hasOwnProperty(i)) {
      self._watchers[i].close();
    }
  }
};

var P2 = function () {
  var self = this;
  self._impl = init_impl;

  //self._impl.end = self.end;
  self._impl.end = function (cb) {
    var self = this;
    console.log('end steps:', self.steps);
    nimble.series(self.steps, function () {
      if (cb) {
        cb();
      }
    });
    return self;
  };

  //self._impl.node = self.node;
  self._impl.node = function (select) {
    var self = this, // _impl
      i;
    if (typeof (select) === 'function') {
      if (select(self.facts)) {
        console.log('function returning _impl');
        return self._impl;
      }
      return init_impl;  // empty _impl

    } else if (select instanceof RegExp) {
      console.log('in RegExp:');
      if (os.hostname().match(select)) {
        console.log('RegExp match');
        console.log('RegExp returning _impl:', self);
        return self;
      }

    } else {
      if (typeof (select) === 'string') {
        select = [ select ]; // make array
      }
      //self.nodes = self._impl.nodes = select;
      self.nodes = select;
      for (i in self.nodes) {
        if (self.nodes.hasOwnProperty(i)) {
          var node = self.nodes[i];
          console.log('node:', node, 'hostname:', os.hostname());
          if (os.hostname() === node) {
            console.log('node match');
            return self;
          }
        }
      }
    }
    console.log('node no match');
    //process.exit(0);
    //return null;
    return init_impl;  // empty _impl
  };
  self._impl.select = self._impl.node;

  //self._impl.watch = self.watch;
  self._impl.watch = function (state) {
    var self = this;  // self is _impl
    console.log('>>>>>>> watch state (parse phase):', state, 'self:', self);
    self._watch_state = state;

    return self;
  };


  //self.steps = [];
  //self._impl.steps = self.steps;
  self._impl.steps = [];

  self._impl.nodes = [];

  self._impl._watch_state = false;
  self._impl._watchers = {};
  self._impl._watch_event_cb_list = [];

  self._impl._watch_trigger_listener = new EventEmitter();
  self._impl._watch_trigger_listener.on('run', function () {
    console.log('_watch_trigger_listener() run triggered');
    var tmp_cb_list = self._impl._watch_event_cb_list;
    self._impl._watch_event_cb_list = [];
    nimble.series(tmp_cb_list);
  });

  self._impl.P2_watch = P2_watch;

  self._impl.P2_unwatch = P2_unwatch;
  self._impl.P2_watchers_close = P2_watchers_close;

  /**
   * send event to master
   */
  self._impl.sendevent = function (o) {
    console.log('sendevent, app:', GLOBAL.p2_agent_opts.app);
    var app = GLOBAL.p2_agent_opts.app,
      post_data = querystring.stringify(o),
      options = {
        host: app.master, // TODO: param'ize
        port: app.master_port,
        path: '/_event',
        method: 'POST',
        rejectUnauthorized: false,
        //requestCert: true,
        agent: false,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': post_data.length
        }
      };

    var post_req = app.https.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.warn('Response: ' + chunk);
      });
    });

    post_req.write(post_data);
    post_req.end();
  };

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
  self._impl.facts = self.facts;
  //console.log('_modules:', _modules);

  //console.log('before global facts:', self.facts);

  self._impl.print_facts = function () {
    if (GLOBAL.p2_agent_opts && GLOBAL.p2_agent_opts.showfacts) {
      console.log(JSON.stringify(self.facts, null, 2));
    }
  };

  // Link modules
  _.each(Object.keys(_modules), function (m) {
    //console.log('m:', m);
    self[m] = self._impl[m] = _modules[m];
  });

  //self.p2Dummy = new P2dummy(Object.keys(_modules));
  //console.log('P2 self:', self);

  return self._impl;  // after this self will be _impl
};

/*
P2.prototype.end = function (cb) {
  var self = this;
  console.log('end steps:', self.steps);
  nimble.series(self.steps, function () {
    if (cb) {
      cb();
    }
  });
  return self;
};

P2.prototype.node = function (select) {
  var self = this, // _impl
    i;
  if (typeof (select) === 'function') {
    if (select(self.facts)) {
      console.log('function returning _impl');
      return self._impl;
    }
    return init_impl;  // empty _impl

  } else if (select instanceof RegExp) {
    console.log('in RegExp:');
    if (os.hostname().match(select)) {
      console.log('RegExp match');
      console.log('RegExp returning _impl:', self);
      return self;
    }

  } else {
    if (typeof (select) === 'string') {
      select = [ select ]; // make array
    }
    //self.nodes = self._impl.nodes = select;
    self.nodes = select;
    for (i in self.nodes) {
      if (self.nodes.hasOwnProperty(i)) {
        var node = self.nodes[i];
        console.log('node:', node, 'hostname:', os.hostname());
        if (os.hostname() === node) {
          console.log('node match');
          return self;
        }
      }
    }
  }
  console.log('node no match');
  //process.exit(0);
  //return null;
  return init_impl;  // empty _impl
};
P2.prototype.select = P2.prototype.node;  // alias of node

P2.prototype.watch = function (state) {
  var self = this;  // self is _impl
  console.log('>>>>>>> in file watch state (parse phase):', state, 'self:', self);
  self._watch_state = state;

  return self;
};
*/


module.exports = P2;
