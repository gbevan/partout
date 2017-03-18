/*jshint node: true*/
'use strict';

exports.example = (options) => {
  return function (hook) {
    // custom global hook
    // return Promise.resolve(hook), or
    // return Promise.reject(err)
  };
};
