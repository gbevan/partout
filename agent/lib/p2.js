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

/*jslint node: true, nomen: true, vars: true, esversion: 6*/
'use strict';

/*global global, p2 */

var console = require('better-console'),
    _ = require('lodash'),
    nimble = require('nimble'),
    os = require('os'),
    exec = require('child_process').exec,
    path = require('path'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    querystring = require('querystring'),
    Q = require('q'),
    u = require('util'),
    utils = new (require('./utils'))(),
    heredoc = require('heredoc');


var P2Emitter = function () {
  var self = this;
  EventEmitter.call(self);
  return self;
};
P2Emitter.prototype.on = function (eventName, listener) {
  var self = this;
  self.addListener(eventName, function () {
    p2.pushSteps();
    listener.apply(this, arguments);
    p2.flattenSteps();
  });

};
u.inherits(P2Emitter, EventEmitter);


Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};


var init_impl = function _impl() { this._id = '_impl'; },
    empty_impl = Object.create(init_impl);

/**
 * Set a watcher on a filesystem object
 * @function
 * @param file {String} file name / path
 * @param cb {Function} callback(callback({module:..., object:..., msg:...}), event, filename)
 * @memberof P2
 */
var P2_watch = function (file, watch_action_fn) {
  //console.log('P2_watch() this:', this);
  var self = this;  // is _impl

  utils.dlog('>>>>>>>>>>> P2_watch for file: %s', file);

  // called when file object changed
  function queue_event (event, filename) {
    utils.dlog('queue_event() event:', event, 'filename:', filename);
    var qlen = self._watch_event_cb_list.length;
    //self._watch_event_cb_list.push(cb);
    self._watch_event_cb_list.push(function (nimblecb) {
      watch_action_fn(
        function (o) {
          utils.dlog('nimble callback wrapper o:', o);
          if (o && o.msg && o.msg.length > 0) {
            self.sendevent(o);
            utils.dlog('************* RETURNING TO NIMBLE after actioned watch responses stack:\n' + (new Error('trc')).stack);
          } else {
            utils.dlog('************* RETURNING TO NIMBLE after non-actioned watch responses stack:\n' + (new Error('trc')).stack);
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
      if (self._watchers[file]) {
        utils.vlog('Skipping request to watch file %s as watcher already exists', file);
      } else {
        utils.vlog('Adding to watch list, file:', file);
        self._watchers[file] = fs.watch(file, {persistent: false}, queue_event);
      }
    } else {
      console.warn(file, 'does not yet exist, watch ignored for now');
    }
  });
};

var P2_unwatch = function (file) {
  var self = this;  // is _impl
  if (self._watchers[file]) {
    utils.dlog('<<<<<<<<<<< P2_unwatch closing watcher for file: %s', file);
    self._watchers[file].close();
    delete self._watchers[file];
  }
};

var P2_watchers_close = function () {
  var self = this,  // is _impl
    i;
  for (i in self._watchers) {
    if (self._watchers.hasOwnProperty(i)) {
      utils.dlog('Closing watcher for file:', i);
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

  self._impl.emitter = new P2Emitter();

  /**
   * Set a listener for a p2 event
   * .on('package:rabbitmq-server:changed', function () { ... }
   * @returns {object} p2 dsl object
   */
  self._impl.on = function (ev, fn) {
    var self = this;

    utils.dlog('on() Adding listener for:', ev);
    //self.emitter.on.apply(self.emitter, arguments);
    self.emitter.on.call(self.emitter, ev, function () {
      console.info(u.format('(p2) Event Triggered: %s', ev));
      return fn.apply(this, arguments);
    });
    utils.dlog('on() count:', self.emitter.listenerCount(arguments[0]));
    return self;
  };

  /**
   * require module from partout's agent library (for use in agent manifests/roles)
   * @param   {string} name module name
   * @returns {object} loaded module
   */
  self._impl.require = function (name) {
    return require(path.join(self._impl.core_lib_path, name));
  };

  /**
   * execute accrued actions
   * @function
   * @return {class} P2 DSL impl
   * @memberof P2
   */
  self._impl.end = function (cb) {
    var self = this;

    // async loop shifting tasks from the steps queue
    var t = self.steps.shift();
    if (!t) {
      cb();
    } else {
      if (utils.isDebug()) {
        console.warn('>>> START ACTION >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      }

      utils.dlog('end(): calling action t() t:', t);
      t(function () { // step queuecb
        utils.dlog('end(): callback from t()');

        if (utils.isDebug()) {
          console.warn('<<< END ACTION <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
        }

        process.nextTick(function () {
          self.end(cb);
        });
      });
    }

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
        //console.log('function returning true');
        return true;
      }
      return false;

    } else if (select instanceof RegExp) {
      //console.log('in RegExp:');
      if (os.hostname().match(select)) {
        //console.log('RegExp match');
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
          //console.log('node:', node, 'hostname:', os.hostname());
          if (os.hostname() === node) {
            //console.log('node match');
            return true;
          }
        }
      }
    }
    //console.log('node no match');
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

  // store __dirname for agent manifests to locate agent core modules
  self._impl.core_lib_path = __dirname;

  // LIFO stack for steps (to allow roles to push their nested steps to the front of the queue)
  self._impl.steps_stack = [];

  // FIFO queue of action steps from p2 manifests
  self._impl.steps = [];

  self._impl.nodes = [];

  self._impl._watch_state = false;
  self._impl._watchers = {};
  self._impl._watch_event_cb_list = [];

  self._impl._watch_trigger_listener = new EventEmitter();
  self._impl._watch_trigger_listener.on('run', function () {
    utils.dlog('_watch_trigger_listener() run triggered');
    var tmp_cb_list = self._impl._watch_event_cb_list;
    self._impl._watch_event_cb_list = [];
    nimble.series(tmp_cb_list, function () {
      utils.dlog('########### Nimble series completed on _watch_event_cb_list');
      utils.dlog('########################################################################');
    });
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
    //console.log('sendevent, p2_agent_opts:', u.inspect(GLOBAL.p2_agent_opts, {colors: true, depth: 3}));
    if (o && global.p2_agent_opts.app) {
      global.p2_agent_opts.app.sendevent(o);
    }
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

  self._impl.qEvent = function (o) {
    if (global.p2_agent_opts.app) {
      var master =  global.p2_agent_opts.app.master;
      master.qEvent(self.facts, o);
    } else {
      console.info('Partout Event:', o);
    }
  };

  /**
   * convert multi-line comment in function to string, for use as here documents
   * e.g.
   *    str = p2.heredoc(function () {/*
   *    this is a
   *      multi-line
   *        string...
   *    });
   * @function
   * @memberof P2
   * @param {Function} heredoc function () {\/* multi-line-strin \*\/}
   */
  self._impl.heredoc = heredoc;

  /**
   * Check if this node's facts has a class assigned (in agent_classes)
   * @param   {[[Type]]} c [[Description]]
   * @returns {[[Type]]} [[Description]]
   */
  self._impl.hasClass = function (c) {
    return (self.facts.agent_classes[c] === true);
  };

  /**
   * dump discovered facts
   * @function
   * @memberof P2
   */
  self._impl.dumpFacts = function () {
    self._impl.push_action(function (queuecb) {
      console.log(u.inspect(self.facts, {colors: true, depth: 6}));
      queuecb();
    });
  };

  /**********************************************************************************
   * p2 file imports and actions
   */

  /**
   * initialise the action queue (in steps)
   * @function
   * @memberof p2
   */
  self._impl.clear_actions = function () {
    self._impl.steps = [];
  };

  /**
   * Push current steps on steps_stack
   * @function
   * @memberof p2
   */
  self._impl.pushSteps = function () {
    self._impl.steps_stack.push(self._impl.steps);
    self._impl.steps = [];

    return self._impl;
  };

  /**
   * Flatten current steps with steps previously pushed onto steps_stack
   * @function
   * @memberod p2
   */
  self._impl.flattenSteps = function () {
    var newSteps = self._impl.steps;
    self._impl.steps = newSteps.concat(self._impl.steps_stack.pop());
    //console.warn('!!! flattenSteps: concat steps:', u.inspect(self._impl.steps, {colors: true, depth: 3}));

    return self._impl;
  };

  /**
   * push action step on to the list to execute by .end()
   * @function
   * @memberof P2
   * @param {Function} action
   */
  self._impl.push_action = function (action) {
    var method;

    self._impl.steps.push(function (queuecb) {
      utils.dlog('p2: push_action: step action:', action);

      var p = action.call(self);

      if (utils.isDebug()) {
        console.warn('p2: push_action action.call returned p:', p);
        console.warn('p2: push_action p is promise:', Q.isPromise(p));
      }

      if (p && Q.isPromise(p)) {
        p
        .done(function (o) {
          utils.dlog('p2: push_action: step promise resolved to o:', o);
          queuecb();

        }, function (err) {
          utils.dlog('p2: push_action: step promise rejected with err:', err);
          console.error(err);
          console.error(err.stack);
          console.warn('flushing action queue of remaining steps for abort...');
          self._impl.clear_actions();
          queuecb();  /// XXX: ???
        });
      }
    });
  };


  var _modules;

  // Use globally cached facts
  utils.tlogs('require modules');
  var module_promise;
  if (global.p2 && global.p2.facts) {
    utils.dlog('>>> Using cached facts');
    //console.log('>>> Using cached facts');
    self.facts = global.p2.facts;
    //_modules = require('./modules')();
    module_promise = require('./modules')();

  } else {
    //console.log('>>> Refreshing facts');
    self.facts = {
      p2module: {},
      agent_classes: {}
    };
    //_modules = require('./modules')(self.facts);
    module_promise = require('./modules')(self.facts);
  }

  module_promise
  .then(function (_modules) {
    utils.tloge('require modules');
    //console.log('modules loaded with facts');
    //console.log('p2 facts:', self.facts);
    self._impl.facts = self.facts;
    if (global.p2) {
      global.p2.facts = self.facts;
    }
    //console.log('p2.js facts.installed_packages[nginx]:', self.facts.installed_packages.nginx);


    /**
     * print discovered facts
     * @function
     * @memberof P2
     */
    self._impl.print_facts = function () {
      if (global.p2_agent_opts && global.p2_agent_opts.showfacts) {
        console.log(u.inspect(self.facts, {colors: true, depth: 6}));
      }
    };

    // Link modules as DSL commands
    _.each(Object.keys(_modules), function (m) {
      //console.log('p2 m:', m);

      /*
       * Create DSL Command of this module
       */
      self[m] = self._impl[m] = function () {  // command execution
        var _impl = this,
          args = [];

        args.push(_impl);
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        //console.log('p2 dsl args:', u.inspect(args, {colors: true, depth: 2}));

        var c = new _modules[m]();
        //console.log('p2 m:', _modules[m].prototype);
        //console.log('c:', c);

        if (c.runAction) {
          //var immedArgs = [_impl, undefined, false];
          var immedArgs = [_impl, false];
          immedArgs.push.apply(immedArgs, arguments);
          c.runAction.apply(c, immedArgs);

        } else {
          utils.vlog(u.format('module %s has no runAction method', m));
        }

        if (c.addStep) {
          c.addStep.apply(c, args);
        } else {
          console.error(u.format('module %s has no addStep/action method, action ignored', m));
        }
        return _impl;
      };

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
