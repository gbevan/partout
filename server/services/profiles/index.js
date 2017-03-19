/*jshint node: true*/
'use strict';

const service = require('feathers-waterline'),
      profiles = require('./profiles-model'),
      hooks = require('./hooks');

module.exports = function () {
  const app = this;

  const options = {
    Model: app.orm.collections.profiles,
    paginate: {
      default: 10,
      max: 10
    }
  };

  app.use('/profiles', service(options));

  const profilesService = app.service('/profiles');

  profilesService.before(hooks.before);
  profilesService.after(hooks.after);
};
