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
    pfs = require('./pfs'),
    EventEmitter = require('events').EventEmitter,
    querystring = require('querystring'),
    Q = require('q'),
    u = require('util'),
    utils = require('./utils'),
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
 * Clear require cache of *.p2 (roles etc)
 */
var P2_Clear_P2_Cache = function () {
  /*
   * remove previously loaded .p2 modules and roles, for reloading
   */
  var p2Re = new RegExp(/\.p2$/);
  _.each(require.cache, function (v, k) {
    if (k.match(p2Re)) {
      delete require.cache[k];
    }
  });
};

/**
 * Set a watcher on a filesystem object
 * @function
 * @param file {String} file name / path
 * @param cb {Function} callback(callback({module:..., object:..., msg:...}), event, filename)
 * @memberof P2
 */
var P2_watch = function (file, watch_action_fn) {
  var self = this;  // is _impl

  utils.dlog('>>>>>>>>>>> P2_watch for file: %s', file);

  // called when file object changed
  function queue_event (event, filename) {
    utils.dlog('queue_event() event:', event, 'filename:', filename);
    var qlen = self._watch_event_cb_list.length;
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

    if (self.ifNode()) {

      utils.dlog('on() Adding listener for:', ev);
      self.emitter.on.call(self.emitter, ev, function () {
        console.info(u.format('(p2) Event Triggered: %s', ev));

        p2.pushSteps(); // save steps state
        var res = fn.apply(this, arguments);
        p2.flattenSteps(); // pop previous steps state after new steps

        return res;
      });
      utils.dlog('on() count:', self.emitter.listenerCount(arguments[0]));

    }
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
    var tobj = self.steps.shift();

    if (!tobj) {
      cb();

    } else {
      var tnode = tobj.node,
          t = tobj.fn;

      if (utils.isDebug()) {
        console.warn('>>> START ACTION >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      }

      utils.dlog('end(): calling action tnode:', tnode);
      self._node_select = tnode;

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
    utils.dlog('node() _node_select:', self._node_select);
    return self;
  };

  /**
   * Get the current node state
   * @returns {any} contents of _impl._node_select.
   */
  self._impl.getNode = function () {
    var self = this;
    return self._node_select;
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

    utils.dlog('ifNode(): select:', select);

    if (select === undefined) {
      utils.dlog('ifNode(): undefined -> pass');
      return true;
    }
    if (typeof (select) === 'boolean') {
      utils.dlog('ifNode(): boolean ->', select);
      return select;

    } else if (typeof (select) === 'function') {
      if (select(self.facts)) {
        utils.dlog('ifNode(): function -> pass');
        return true;
      }
      utils.dlog('ifNode(): function -> skip');
      return false;

    } else if (select instanceof RegExp) {
      if (os.hostname().match(select)) {
        utils.dlog('ifNode(): regex -> pass');
        return true;
      }

    } else {
      if (typeof (select) === 'string') {
        select = [ select ]; // make array
      }
      self.nodes = select;
      for (i in self.nodes) {
        if (self.nodes.hasOwnProperty(i)) {
          var node = self.nodes[i];
          utils.dlog('node:', node, 'hostname:', os.hostname());
          if (os.hostname() === node) {
            utils.dlog('ifNode(): string|array -> pass');
            return true;
          }
        }
      }
    }
    utils.dlog('ifNode(): fall through to -> skip');
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
      self._watch_state = state;
    }
    return self;
  };

  // store __dirname for agent manifests to locate agent core modules
  self._impl.core_lib_path = __dirname;

  // List of fact methods from loaded roles to be gathered from prior prior to returning facts to called
  self._impl.roles_facts_fn_list = [];

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
    if (o && global.p2_agent_opts.app) {
      global.p2_agent_opts.app.sendevent(o);
    }
  };

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
   * @param   {string}  c Class name
   * @returns {boolean} true if class has been assigned
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
    self._impl.steps_stack = [];
  };

  /**
   * Push current steps on steps_stack
   * @function
   * @memberof p2
   */
  self._impl.pushSteps = function () {
    utils.dlog('p2 pushSteps()');
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
    utils.dlog('p2 flattenSteps()');
    var newSteps = self._impl.steps;
    self._impl.steps = newSteps.concat(self._impl.steps_stack.pop());

    return self._impl;
  };


  /**
   * Emit an event to P2 DSL listeners (see p2.on(...) directive).
   * @param {string} name  module name (e.g. self._name)
   * @param {string} title DSL directive's title
   * @param {object} opts  DSL directive's options
   * @param {object} o     Module or Role returned results object
   */
  self._impl.emit = function(name, title, opts, o) {
    var ev_prefix = u.format('%s:%s', name, title);

    if (o && o.result) {
      var evname = u.format('%s:%s', ev_prefix, o.result);

      utils.dlog(u.format(
        'p2: %s title: %s - _impl.emit() o: %s, emitting: %s',
        name,
        title,
        u.inspect(o, {colors: true, depth: 2}),
        evname
      ));

      var hadListeners = self._impl.emitter.emit(evname, {
        eventname: evname,
        module: name,
        title: title,
        opts: opts
      });

      if (!hadListeners && utils.isDebug()) {
        console.warn(u.format('p2: event %s had no listeners', evname));
      }
    }
  };

  /**
   * push action step on to the list to execute by .end()
   * @function
   * @memberof P2
   * @param {Function} action
   */
  self._impl.push_action = function (action) {
    var method;

    self._impl.steps.push({
      // node state when pushed onto steps
      node: self._impl._node_select,
      // task function to exec sequentially
      fn: function (queuecb) {
        utils.dlog('p2: push_action: step action:', action);

        var p = action.call(self);

        if (utils.isDebug()) {
          console.warn('p2: push_action action.call returned p:', p);
          console.warn('p2: push_action p is promise:', Q.isPromise(p));
        }

        if (!Q.isPromise(p)) {
          p = Q(p);
        }

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

    }); // push
  };


  var _modules;

  // Use globally cached facts
  utils.tlogs('require modules');
  var module_promise;
  if (global.p2 && global.p2.facts) {
    utils.dlog('>>> Using cached facts');
    self.facts = global.p2.facts;
    module_promise = require('./modules')();

  } else {
    utils.dlog('P2 >>> Refreshing facts');

    self.facts = {
      p2module: {},
      agent_classes: {}
    };
    module_promise = require('./modules')(self.facts);
  }

  module_promise
  .then(function (_modules) {
    utils.tloge('require modules');

    self._impl.facts = self.facts;
    if (global.p2) {
      global.p2.facts = self.facts;
    }

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

        var c = new _modules[m]();

        if (c.runAction) {
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

    global.p2 = self._impl;

    /*
     * remove previously loaded .p2 modules and roles, for reloading
     */
    P2_Clear_P2_Cache();

    /*
     * Load core roles
     */
    var rolespath = path.join('lib', 'roles');

    return pfs.pReadDir(rolespath)
    .then(function (roles_manifest) {
      var roles_facts_deferred = Q.defer();

      _.each(roles_manifest, function (role) {
        var rfile = path.join(rolespath, role);

        var rfile_stat;
        try {
          rfile_stat = fs.statSync(rfile); // must be sync!
        } catch (e) {
          if (e.code !== 'ENOENT') {
            throw(e);
          }
        }

        if (rfile_stat && rfile_stat.isDirectory()) {
          rfile = path.join(rfile, 'index.p2');
        }

        var r = require(path.resolve(rfile));

      });

      utils.dlog('P2 starting roles_facts_fn_list');
      nimble.series(
        self._impl.roles_facts_fn_list,
        function (err, cb) {
          if (err) {
            return roles_facts_deferred.reject(err);
          }
          utils.dlog('P2 resolving roles_facts_fn_list');
          roles_facts_deferred.resolve();
          cb();
        }
      );

      return roles_facts_deferred.promise;

    }) // pfs.pReadDir(rolespath)
    .then(function () {
      var end_deferred = Q.defer();

      // execute the accrued steps
      p2.end(function () {
        utils.vlog('### END OF LOADING MODULES & CORE ROLES ######################');

        end_deferred.resolve();
      });

      return end_deferred.promise;
    })
    //.done()
    ;

  })

  .done(function () {
    deferred.resolve(self._impl); // pass DSL fwd to Policy()

  }, function (err) {
    if (err) {
      console.error('p2 modules load err:', err);
      console.warn('stack:', err.stack);
      deferred.reject(err);
    }
  });

  return deferred.promise;
};

module.exports = P2;
