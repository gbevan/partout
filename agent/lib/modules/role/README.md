# Module Role

Roles are dynamically created modules, that can be expressed either using P2M DSL notation (facts and actions) or as a p2 declaration.

```javascript
p2
.role('testRole', {

  facts: function (deferred, facts_so_far, title, opts) {
    var facts = {
      p2role: {
        testRole: {
          loaded: true
        }
      }
    };
    ...
    deferred.resolve(facts);
  },

  p2: function (title, opts) {
    p2
    .command('echo from testRole')
    ;
  }
})
;
```

this can then be used later:

```javascript
p2
.testRole('myTestRole', {option: value, ...})
;
```

Role facts are run immediately before the p2 action (not like module facts, which are run before any p2 actions are loaded).

| Provider   | Support Status | Unit Tests |
|:----------:|:--------------:|:----------:|
| n/a        | &#x2713;       | &#x2713;   |
