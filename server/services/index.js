/*jshint node: true*/
'use strict';

const cfg = new (require('../../etc/partout.conf.js'))(),
      utils = require('../../agent/lib/utils'),
      Q = require('q'),
      uuid = require('uuid');

const Waterline = require('waterline'),
      arangodbAdaptor = require('@partoutx/sails-arangodb'),
      service = require('feathers-waterline'),
      serviceUtils = require('feathers-waterline/lib/utils'),
      errors = require('feathers-errors'),
      filter = require('feathers-query-filters'),
      ORM = new Waterline(),
      authentication = require('./authentication'),

      Agents = require('./agents'),
      Csrs = require('./csrs'),
      Environments = require('./environments'),
      Permissions = require('./permissions'),
      Profiles = require('./profiles'),
      Roles = require('./roles'),
      Users = require('./users'),

      Agents_Model = require('./agents/agents-model'),
      Csrs_Model = require('./csrs/csrs-model'),
      Environments_Model = require('./environments/environments-model'),
      Permissions_Model = require('./permissions/permissions-model'),
      Profiles_Model = require('./profiles/profiles-model'),
      Roles_Model = require('./roles/roles-model'),
      Users_Model = require('./users/users-model');

const debug = require('debug').debug('partout:services');

module.exports = function(cb) {

  return function () {
    const app = this;
    this.waterline_config = cfg.waterline_config;
    this.waterline_config.adapters = {
      'default': arangodbAdaptor,
      arangodb: arangodbAdaptor
    };

    ORM.loadCollection(Agents_Model);
    ORM.loadCollection(Csrs_Model);
    ORM.loadCollection(Environments_Model);
  //    ORM.loadCollection(Profiles_Model);
    ORM.loadCollection(Permissions_Model);
    ORM.loadCollection(Roles_Model);
    ORM.loadCollection(Users_Model);

    ORM.initialize(this.waterline_config, (err, o) => {
      if (err) {
        console.error(err);
        return cb(err);
      }

      app.orm = o;

      /////////////////////////////
      // Global Feathers services

      debug('before configure auth');
      app.configure(authentication);

      app.configure(Agents);
      app.configure(Csrs);
      app.configure(Environments);
      app.configure(Permissions);
//      app.configure(Profiles);
      app.configure(Roles);
      app.configure(Users);

      debug('before cb()');
      if (cb) {
        cb(null, o);
      }
    });
  };

};
