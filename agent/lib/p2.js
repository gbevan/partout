/*jshint newcap: false*/
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
  querystring = require('querystring'),
  Q = require('q');

Q.longStackSupport = true;

var init_impl = function _impl() {  },
  empty_impl = Object.create(init_impl);

/**
 * Set a watcher on a filesystem object
 * @function
 * @param file {String} file name / path
 * @param cb {Function} callback(callback({module:..., object:..., msg:...}), event, filename)
 */
var P2_watch = function (file, cb) {
  //console.log('P2_watch() this:', this);
  var self = this;  // is _impl


  function queue_event (event, filename) {
    console.log('queue_event() event:', event, 'filename:', filename);
    var qlen = self._watch_event_cb_list.length;
    //self._watch_event_cb_list.push(cb);
    self._watch_event_cb_list.push(function (nimblecb) {
      cb(
        function (o) {
          //console.log('o:', o);
          if (o && o.msg && o.msg.length > 0) {
            self.sendevent(o);
          }
          nimblecb();
        },
        event,
        filename
      );
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

  fs.exists(file, function (exists) {
    if (exists) {
      // NOTE: _watchers are closed in P2_watchers_close() below
      // TODO: Allow multiple watchers per object, e.g. from different modules.
      // Maybe make value a list to push handlers on to.
      console.log('Adding to watch list, file:', file);
      self._watchers[file] = fs.watch(file, {persistent: false}, queue_event);
    } else {
      console.warn(file, 'does not yet exist, watch ignored for now');
    }
  });
};

var P2_unwatch = function (file) {
  var self = this;  // is _impl
  if (self._watchers[file]) {
    console.log('P2_unwatch closing watcher for file:', file);
    self._watchers[file].close();
    delete self._watchers[file];
  }
};

var P2_watchers_close = function () {
  var self = this,  // is _impl
    i;
  for (i in self._watchers) {
    if (self._watchers.hasOwnProperty(i)) {
      console.log('Closing watcher for file:', i);
      self._watchers[i].close();
    }
  }
};

/**
 * P2 implementor of the Partout Domain Specific Language.
 * @constructor
 */
var P2 = function () {
  var self = this,
    deferred = Q.defer();
  self._impl = Object.create(init_impl);

  /**
   * execute accrued actions
   * @function
   * @return {class} P2 DSL impl
   * @memberof P2
   */
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

  /**
   * DSL filter by node
   * (alias: select)
   * @return {class} P2 DSL impl
   * @memberof P2
   */
  self._impl.node = function (select) {
    var self = this;
    self._node_select = select;
    return self;
  };

  /**
   * Check if current node selected for this rule (used in modules before
   * adding actions to _impl steps).
   * @returns {boolean} true=this node is selected by last .node(...)
   */
  self._impl.ifNode = function () {
    var self = this, // _impl
      i;
    var select = self._node_select;


    if (select === undefined) {
      return true;
    }
    if (typeof (select) === 'boolean') {
      return select;

    } else if (typeof (select) === 'function') {
      //console.log('in ifNode facts:', self.facts);
      if (select(self.facts)) {
        console.log('function returning true');
        return true;
      }
      return false;

    } else if (select instanceof RegExp) {
      //console.log('in RegExp:');
      if (os.hostname().match(select)) {
        console.log('RegExp match');
        return true;
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
            return true;
          }
        }
      }
    }
    console.log('node no match');
    //console.log('init_impl:', init_impl);
    //process.exit(0);
    //return null;
    //console.log('empty_impl:', empty_impl);
    return false;
  };
  /**
   * filter by node
   * (alias: node)
   * @return {class} P2 DSL impl
   * @function
   * @memberof P2
   */
  self._impl.select = self._impl.node;

  /**
   * enable watcher
   * @param {boolean | string} boolean set watch on/off, or name of file (requires function parameter)
   * @param {function} Callback when watch triggered
   * @return {class} P2 DSL impl
   * @memberof P2
   */
  self._impl.watch = function (state, func) {
    var self = this;  // self is _impl

    if (typeof(state) === 'string' && typeof(func) === 'function') {
      self.P2_watch(state, func);
    } else {
      //console.log('>>>>>>> watch state (parse phase):', state, 'self:', self);
      self._watch_state = state;
    }
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

  /**
   * Set a watcher on a filesystem object
   * @function
   * @param {String} file name
   * @param {Function} callback
   * @memberof P2
   */
  self._impl.P2_watch = P2_watch;

  /**
   * Unset a watcher on a filesystem object
   * @function
   * @param {String} file name
   * @memberof P2
   */
  self._impl.P2_unwatch = P2_unwatch;

  /**
   * Close all watchers
   * @function
   * @memberof P2
   */
  self._impl.P2_watchers_close = P2_watchers_close;

  /**
   * send event to master
   * @function
   * @param {Object} - {
   *    module: 'file',
   *    object: filename,
   *    msg: string of actions taken
   *  }
   * @memberof P2
   */
  self._impl.sendevent = function (o) {
    console.log('sendevent, app:', GLOBAL.p2_agent_opts.app);
    GLOBAL.p2_agent_opts.app.sendevent(o);
    /*
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
    */
  };
  //self._impl.sendevent = GLOBAL.p2_agent_opts.app.sendevent;

  /**
   * push action step on to the list to execute by .end()
   * @function
   * @memberof P2
   * @param {Function} action
   */
  self._impl.push_action = function (action) {
    self._impl.steps.push(function (nimblecb) {
      console.warn('Executing a step');
      action.call(self, function (o) {
        console.log('o:', o);
        if (o && o.msg && o.msg.length > 0) {
          self._impl.sendevent(o);
        }
        nimblecb();
      });
    });
  };

  //console.log('P2 this:', this);

  var _modules;

  // Use globally cached facts
  var module_promise;
  if (GLOBAL.p2 && GLOBAL.p2.facts) {
    console.warn('>>> Using cached facts');
    self.facts = GLOBAL.p2.facts;
    //_modules = require('./modules')();
    module_promise = require('./modules')();
  } else {
    self.facts = {};
    //_modules = require('./modules')(self.facts);
    module_promise = require('./modules')(self.facts);
  }

  module_promise
  .then(function (_modules) {
    self._impl.facts = self.facts;
    if (GLOBAL.p2) {
      GLOBAL.p2.facts = self.facts;
    }


    /**
     * print discovered facts
     * @function
     * @memberof P2
     */
    self._impl.print_facts = function () {
      if (GLOBAL.p2_agent_opts && GLOBAL.p2_agent_opts.showfacts) {
        console.log(JSON.stringify(self.facts, null, 2));
      }
    };

    // Link modules
    _.each(Object.keys(_modules), function (m) {
      //console.log('m:', m);
      self[m] = self._impl[m] = _modules[m];

      // Dummy impl for excluded nodes
      empty_impl[m] = function () { return this; };
    });

    //return self._impl;  // after this self will be _impl

    deferred.resolve(self._impl);
  })
  .done();

  return deferred.promise;
};

module.exports = P2;
