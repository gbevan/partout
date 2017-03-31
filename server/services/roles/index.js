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

  const options_all = {
    Model: app.orm.collections.roles,
    paginate: false
  };

  app.use('/roles', service(options));
  app.use('/roles_all', service(options_all));

  const rolesService = app.service('/roles');
  rolesService.before(hooks.before);
  rolesService.after(hooks.after);

  const rolesAllService = app.service('/roles_all');
  rolesAllService.before(hooks.before);
  rolesAllService.after(hooks.after);
};
