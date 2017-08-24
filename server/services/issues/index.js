/*jshint node: true*/
'use strict';

const service = require('feathers-waterline'),
      issues = require('./issues-model'),
      hooks = require('./hooks');

module.exports = function () {
  const app = this;

  const options = {
    Model: app.orm.collections.issues,
    paginate: {
      default: 10,
      max: 10
    }
  };

  const options_all = {
    Model: app.orm.collections.issues,
    paginate: false
  };

  app.use('/issues', service(options));
  app.use('/issues_all', service(options_all));

  const issuesService = app.service('/issues');
  issuesService.before(hooks.before);
  issuesService.after(hooks.after);

  const issuesAllService = app.service('/issues_all');
  issuesAllService.before(hooks.before);
  issuesAllService.after(hooks.after);
};
