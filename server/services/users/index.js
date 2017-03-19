/*jshint node: true*/
'use strict';

const service = require('feathers-waterline'),
      users = require('./users-model'),
      hooks = require('./hooks');

module.exports = function () {
  const app = this;

  const options = {
    Model: app.orm.collections.users,
    paginate: {
      default: 10,
      max: 10
    }
  };

  app.use('/users', service(options));

  const usersService = app.service('/users');

  usersService.before(hooks.before);
  usersService.after(hooks.after);
};
