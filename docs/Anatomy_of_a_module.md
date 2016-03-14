Anatomy of a Partout Module
===========================

Partout modules (also called P2 Modules) are defined by executing P2M.Module() and creating a DSL-like set of method handlers, namely: name(), facts() and action().

Simple example from the File module:

```javascript
/*jslint node: true, nomen: true, vars: true*/
/*global p2 */
'use strict';

var P2M = require('../../p2m'),
    ...
    ;

Q.longStackSupport = true;

/**
 * @module File
 *
 * @description
 * File module
 * ===========
 *
 *     p2.node([...])
 *       .file('file or title', options, function (err, stdout, stderr) { ... });
 *
 * Options:
 *
 *   | Operand     | Type    | Description                            |
 *   |:------------|---------|:---------------------------------------|
 *   | path        | String  | File path, overrides title             |
 *   | ensure      | String  | Present, absent, file, directory, link |
 *   | content     | String  | Content of file, can be object containing {file: 'filaname'} or {template: 'template file'} |
 *   | is_template | Boolean | Content is a template                  |
 *   | mode        | String  | Octal file mode                        |
 *   | owner       | String  | Owner of this file object              |
 *   | group       | String  | Group owner of this file object        |
 *   | watch       | Boolean | Watch this file object for changes and reapply policy |
 *
 *   Templates use the [Mustache](https://www.npmjs.com/package/mustache) templating library.
 *
 * ---
 * also supports:
 *
 * Watches for real-time reapplication of policy when a file object is changed
 *
 *     .watch(true)
 *     .file('your_file_to_watch', {ensure: 'file', content: 'template_file'})
 *     .watch(false)
 *     ...
 *
 * ---
 */

var File = P2M.Module(function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('file')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      file_loaded: true
    };
    deferred.resolve(facts);
  })

  //////////////////
  // Action handler
  .action(function (args) {

    var deferred = args.deferred,
        inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '',
        file = title;

    if (opts.path) {
      file = opts.path;
    }

    ...

  });
});

```

The jsdoc comment on the constructor is important, it documents the supported options for this module.  These comments are automatically extracted by ```gulp docs``` to generate the API documentation.

```self.name``` defines the P2 DSL command, in this case .file(...).

```self.facts``` defines a method, that will be called before any action steps to pre-gather facts about the agent.

```self.action``` defines the action that will be taken by this DSL directive - these are executed in the sequence that they are defined in, in the P2 DSL pp policy definition.

The action method is passed a set of arguments:

| Argument | Description |
| :------: | :---------- |
| ```deferred``` | A Q deferred object, provided by the P2M module calling this action, resolving this completes this action and allows artout to move on to the next P2 DSL Policy Directive - BE CAREFUL TO ALWAYS CALL THIS ON COMPLETION, being mindful that your module is likely running asyncronously... |
| ```inWatchFlag``` | Is this action being called from a file system watch event (True) or simply from being executed in policy sequence (False) |
| ```_impl``` | This is the P2 DSL object that provides the language elements (method chaining).  ```_impl.facts``` holds all of the discovered facts for this run of the policy. |
| ```title``` | Target object name or title |
| ```opts``` | Options provided to the policy directive, e.g. </br>```.file('/etc/hosts', {ensure: 'present'})``` |
| ```cb``` | Optional callback provided to the policy directive, e.g. </br>```.file('...', {...}, function () { // called after action completes })``` |

These are the arguments provided to all module action handlers.

More complex modules (where processing needs to be split out by operating system etc) can be defined using the helper class ```Provider```.



