/*jshint node: true*/
'use strict';

const service = require('feathers-waterline'),
      permissions = require('./permissions-model'),
      hooks = require('./hooks');

module.exports = function () {
  const app = this;

  const options = {
    Model: app.orm.collections.permissions,
    paginate: {
      default: 10,
      max: 10
    }
  };

  app.use('/permissions', service(options));

  const permissionsService = app.service('/permissions');

  permissionsService.before(hooks.before);
  permissionsService.after(hooks.after);
};
