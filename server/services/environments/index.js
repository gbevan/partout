/*jshint node: true*/
'use strict';

const service = require('feathers-waterline'),
      environments = require('./environments-model'),
      hooks = require('./hooks');

module.exports = function () {
  const app = this;

  const options = {
    Model: app.orm.collections.environments,
    paginate: {
      default: 10,
      max: 10
    }
  };

  app.use('/environments', service(options));

  const environmentsService = app.service('/environments');

  environmentsService.before(hooks.before);
  environmentsService.after(hooks.after);
};
