/*jshint node: true*/
'use strict';

const utils = require('../../../agent/lib/utils');

const service = require('feathers-waterline'),
      errors = require('feathers-errors'),
      filter = require('feathers-query-filters'),
      serviceUtils = require('feathers-waterline/lib/utils'),
      agents = require('./agents-model'),
      hooks = require('./hooks'),
      a_hooks = require('./hooks/agents_all');

const debug = require('debug').debug('partout:service:agents');

class AgentsService extends service.Service {
  constructor(o, app) {
    super(o);
    this.app = app;
  }

  // Overload _get method to populate environment
  // see https://github.com/feathersjs/feathers-waterline/blob/master/src/index.js (MIT)
  _find (params, count, getFilter = filter) {
    let { filters, query } = getFilter(params.query || {});
    let where = serviceUtils.getWhere(query);
    let order = serviceUtils.getOrder(filters.$sort);
    let options = filters.$select ? { select: Array.from(filters.$select) } : {};
    let counter = this.Model.count().where(where);
    let q = this.Model.find(where, options);

    if (order) {
      q.sort(order);
    }

    if (filters.$skip) {
      q.skip(filters.$skip);
    }

    if (filters.$limit) {
      q.limit(filters.$limit);
    }

    const performQuery = total => {
      return q
      .populate('environment')
      .then(data => {
        return {
          total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data
        };
      });
    };

    if (count) {
      return counter.then(performQuery);
    }

    return performQuery();
  }

  // Overload _get method to populate environment
  // see https://github.com/feathersjs/feathers-waterline/blob/master/src/index.js (MIT)
  _get (id) {
    const self = this;

    return this.Model.findOne({ id })
    .populate('environment')
    .then((instance) => {
      if (!instance) {
        debug('app:', self.app);
//        consself.app.report_issue(errors.NotFound(`No record found for id '${id}'`));
        throw self.app.report_issue(new errors.NotFound(`No record found for agent uuid '${id}', perhaps the agent needs re-registering.`));
      }

      return instance;
    });
//    .catch(utils.errorHandler);
  }
}

module.exports = function () {
  const app = this;

  const options = {
    Model: app.orm.collections.agents,
    paginate: {
      default: 10,
      max: 10
    }
  };

  app.use('/agents', new AgentsService(options, app));
  app.use('/agents_all', new AgentsService(options, app));

  const agentsService = app.service('/agents');
  agentsService.before(hooks.before);
  agentsService.after(hooks.after);

  const agentsAllService = app.service('/agents_all');
  agentsAllService.before(a_hooks.before);
  agentsAllService.after(a_hooks.after);

};
