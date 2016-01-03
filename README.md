Partout
=======

Pure Javascript Data and Event Driven Policy Based Configuration Management for the Internet of Everything.

"Partout" is french for "Everywhere"

Modules
-------

### facts
Takes no parameters and is called internally before any other modules, to gather facts about the target system.

If any module contains a method called getFacts, it will be called during fact discover, prior to module execution.

### exec
Execute commands.

### file
Manage files, includes the [Mustache](https://github.com/janl/mustache.js) templating library.

Discovered facts are made available to the templating engine.

P2 Language - Policy Files
--------------------------

P2 is a globally available class for expressing the Partout Domain Specific Language (DSL).

p2 is a globally instantiated object from the P2 class.

Anatomy of a Module
-------------------

* The constructor must be documented using jsdoc, with details of how the module isused. e.g.:

    /**
     @constructor
     * @description
     * Exec module
     * ===========
     *
     *     p2.node([...])
     *       .exec('a command', options, function (err, stdout, stderr) { ... });
     *
     * Options (from https://nodejs.org/api/child_process.html):
     *
     *   | Operand    | Type   | Description                                                |
     *   |:-----------|--------|:-----------------------------------------------------------|
     *   | cwd        | String | Current working directory of the child process |
     *   | env        | Object | Environment key-value pairs |
     *   | encoding   | String | (Default: 'utf8') |
     *   | shell      | String | Shell to execute the command with (Default: '/bin/sh'
     *   |            |        | on UNIX, 'cmd.exe' on Windows, The shell should understand |
     *   |            |        | the -c switch on UNIX or /s /c on Windows. On Windows, |
     *   |            |        | command line parsing should be compatible with cmd.exe.) |
     *   | timeout    | Number | (Default: 0) |
     *   | maxBuffer  | Number | (Default: 200*1024) |
     *   | killSignal | String | (Default: 'SIGTERM') |
     *   | uid        | Number | Sets the user identity of the process. (See setuid(2).) |
     *   | gid        | Number | Sets the group identity of the process. (See setgid(2).) |
     * ...
     */

* Must provide method getName() which simply returns the P2 DSL command name, e.g.:

    Exec.getName = function () { return 'exec'; };

* May optionally provide method getFacts() which will be called prior to P2 policy executions, to pre-gather facts. e.g.:

    Exec.getFacts = function (facts_so_far) {
      var facts = {};
      facts.exec_loaded = true;
      return facts;
    };

  The passed facts_so_far parameter holds all the facts that have been gathered so far.  The facts.js module runs before all other modules to ensure it's facts are available.

* The module's constructor is called with the parameters passed from the P2 policy, e.g.:

    p2
    .exec('runthis_cmd > newfile', {
      creates: 'newfile'
    }, function () {
      ... called when cmd has been run ...
    })
    ...

  The constructor in this case looks like this:

    var Exec = function (cmd, opts, command_complete_cb) {
      var self = this;  // self is parents _impl
      ...

  The ```this``` object is the P2 _impl object that provides the DSL.

* All actions initiated by the module's constructor MUST be pushed on the P2 _impl stack for serialised execution using the provided push_action() method, e.g.:

      self.push_action(function (next_step_callback) {

  The next_step_callback() is called to allow P2 DSL to move onto it's next serialised action for the policy.  It can be used to send a notification event back to the master on completion of this action, e.g.:

      next_step_callback({
        module: 'exec',
        object: opts.creates,
        msg: 'target (re)created'
      });

  *NB: Be mindful that, even though actions are executed in a serialised manner by P2, they are actually being executed asyncronously and require that the next_step_callback() be called to move P2 onto the next action (or completion).

* If you need to do template expansion, use the provided Mustache library.

COPYRIGHT
---------

    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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
