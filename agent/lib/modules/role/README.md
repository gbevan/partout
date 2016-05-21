# Module Role

Roles are dynamically created modules, that can be expressed either using P2M DSL notation (facts and actions) or as a p2 declaration.

```javascript
p2
.role('testRole', {
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
