# P2 Domain Specific Language Design

## Overview of P2 DSL

Example:
```javascript
p2
.command('dir')
.powershell('some powershell command')
.file('filename', {ensure: 'present', content: {file: 'template.t'}})
;
```

The P2 DSL is implemented in Javascript using object chaining to allow a chain of declarative directives to be defined.

These are loaded into a queue and executed in sequence.

Typically the declarative syntax takes the form of:
```javascript
p2
.module_name('resource title or name', [ {options: values} ], [ action complete function ])
```
e.g.
```javascript
p2
.exec('command to run', {cwd: '/tmp', timeout: 1000}, function (err, stdout, stderr) {
  // do extra stuff here
})
```

## Ideas for Development

### A Role Module
This module would allow new modules (and hence P2 commands) to be defined (in ```etc/...```).

e.g.
```javascript
p2
.role('newcommand', {

  facts: function (deferred, facts_so_far) {
    var facts = {};
    // generate new facts
    ...
    deferred.resolve(facts);
  },

  action: function (args) {
    // newcommand action logic
  },

  // or embed p2
  p2: function (p2) {
    // provides a new instance of P2 that is merged in to the global p2 instance
    p2
    .exec(...)
    .file(...)
    .etc...
    ;
  }

})
```

### Structured Roles
Folder layout to allow definition / installation of roles in a structured way, e.g. ```etc/roles/...```

```javascript
|-- etc/
|   `-- manifests/
|   |   `-- site.pp
|   `-- roles/
|       `-- rolename/
|           |-- init.p2
|           `-- modules/

```
Would have a central index of registered roles, backed by GitHub (etc).

The ```init.p2``` file would follow the same approach in defining the role as above [A Role Module](#a-role-module).

The modules folder will allow modules to be embedded in the role package, and be specific to this role in it's scope.
