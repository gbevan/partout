/*jshint node: true*/
'use strict';

const service = require('feathers-waterline'),
      roles = require('./roles-model'),
      hooks = require('./hooks');

module.exports = function () {
  const app = this;

  const options = {
    Model: app.orm.collections.roles,
    paginate: {
      default: 10,
      max: 10
    }
  };

  app.use('/roles', service(options));

  const rolesService = app.service('/roles');

  rolesService.before(hooks.before);
  rolesService.after(hooks.after);
};
