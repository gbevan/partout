# Node EventListener for Inter-Policy Event Triggering and Dependencies

## Proposal

The p2 object provides a common EventListener for the whole policy:

```js
const EventEmitter = require('events');
class P2Emitter extends EventEmitter {}

self._impl.emitter = new P2Emitter();
```

P2M could emit events on behalf of all modules / roles - based upon the deferred promise's resolved value(s):

```js
self.addStep = function (_impl, title, opts, cb) {
  ...
  if (_impl.ifNode()) {
    _impl.push_action(function (nextStepCb, inWatchFlag) {
      var deferred = Q.defer(),
          ev_prefix = u.format('%s:%s', self.name, title);

      fn.call(self, {
        deferred: deferred,
        inWatchFlag: inWatchFlag,
        _impl: _impl,
        title: title,
        opts: opts,
        cb: cb
      });

      deferred.promise
      .fail(function (err) {
        ...
        _impl.emitter.emit(u.format('%s:%s', ev_prefix, 'fatal'), err);
      })
      .then(function (o) {
        ...
        var nextStepFn = function (o, dontCallCb) {
          if (o && o.result) {
            _impl.emitter.emit(u.format('%s:%s', ev_prefix, 'fatal'), o.result);
          }
          if (!dontCallCb) {
            nextStepCb(o);
          }
        }
        nextStepFn(o, true);

        self._runAction(_impl, nextStepFn, inWatchFlag, title, opts, cb);
      })
      .done();
```
Q. How to pass changed|skipped|failed via resolved promise. - simplest is obj.result = 'changed|skipped|failed'


So now a policy could register itself to be triggered on an event:

```js
p2
...
.service('ssh', {
  ensure: 'running',
  enabled: true,
  on: {
    'file:/etc/ssh/sshd_config:changed': 'do_something' | function () {...}
    // ...
  }
})

;
```

In the above example the server module would have a listener:

```js
...
.on(function (event) {
  if (event.trigger === 'restart') {
    // to restart-y stuff
  }
})
```

event in this case may carry more detail from the emitter of the event...

## Could we use event model instead of policy completion callbacks?

Current policy definition model allows for callback functions to be called on completion of the policy being
applied.  (implementation is not universal and varies between modules)

Could we have a standardised approach, also implemented in P2M/P2 instead of per module?
