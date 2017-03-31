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

  const options_all = {
    Model: app.orm.collections.permissions,
    paginate: false
  };

  app.use('/permissions', service(options));
  app.use('/permissions_all', service(options_all));

  const permissionsService = app.service('/permissions');
  permissionsService.before(hooks.before);
  permissionsService.after(hooks.after);

  const permissionsAllService = app.service('/permissions_all');
  permissionsAllService.before(hooks.before);
  permissionsAllService.after(hooks.after);
};
