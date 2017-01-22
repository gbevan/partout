/*jslint node: true */
var assert = require('assert'),
    Q = require('q');

var While = function () {

};

/**
 * Async loop a promisified method with optional delay between iterations
 * @param {object} Object containing:
 *                        {
 *                          condition: function (retry) { return retry; },
 *                          action:    function () { action to run },
 *                          delay:     milliseconds (defaults to 0)
 *                        }
 * @returns {object} results from final action()
 */
While.prototype.pWhile = function(parms) {
  assert.ok(parms);
  assert.ok(parms.condition);
  assert.ok(typeof parms.condition === 'function');
  assert.ok(parms.action);
  assert.ok(typeof parms.action === 'function');

  var condition = parms.condition,
      action = parms.action,
      delay = parms.delay || 0,
      deferred = Q.defer();

  var looper = function() {

    return Q.resolve(action())
    .then(function (res) {
      if (!condition(res)) {
        return deferred.resolve(res);
      }
      setTimeout(looper, delay)
      .unref();
    })
    .done(null, function (err) {
      deferred.reject(err);
    });

  };

  process.nextTick(looper); // 1st call async

  return deferred.promise;
};

module.exports = While;
