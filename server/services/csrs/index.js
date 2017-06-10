/*jshint node: true*/
'use strict';

const Q = require('q'),
      uuid = require('uuid');

const service = require('feathers-waterline'),
      csrs = require('./csrs-model'),
      hooks = require('./hooks'),
      a_hooks = require('./hooks/csrs_all');

class CsrsService extends service.Service {
  constructor(o) {
    super(o);
  }

  register(agent_uuid, ip, csr) {
    console.log('csrsService register agent_uuid:', agent_uuid);

    var self = this,
        deferred = Q.defer(),
        now = new Date();

    // check if csr already exist for this agent's uuid (if one present)
    var p;
    if (agent_uuid) {
      p = self.find({query: {id: agent_uuid}});
    } else {
      p = Q.resolve({total: 0}); //fake empty query
    }
    //console.log('p:', p);
    return p
    .then(function (doc) {
      console.log('doc:', doc);

      if (doc.total === 0) {
        // Create new entry in csrs collection
        var newDoc = {
          id: ((agent_uuid && agent_uuid !== '') ? agent_uuid : uuid.v4()),
          ip: ip,
          csr: csr,
          status: 'unsigned',
          lastSeen: now
        };
        console.log('newDoc:', newDoc);
        return self.create(newDoc)
        .then(function (doc) {
          return doc;
        });

      } else {
        if (doc.total !== 1) {
          throw new Error('Csrs query by agent uuid returned incorrect number of records:', doc.total);
        }
        doc = doc.data[0];
//        doc.csr = csr;
//        doc.lastSeen = now;
        return self.patch(doc.id, {
          csr: csr,
          lastSeen: now
        })
        .then(function () {
          return doc;
        });
      }
    });
  }
}

module.exports = function () {
  const app = this;

  const options = {
    Model: app.orm.collections.csrs,
    paginate: {
      default: 10,
      max: 10
    }
  };

  app.use('/csrs', new CsrsService(options));
  app.use('/csrs_all', new CsrsService(options));

  const csrsService = app.service('/csrs');
  csrsService.before(hooks.before);
  csrsService.after(hooks.after);

  const csrsAllService = app.service('/csrs_all');
  csrsAllService.before(a_hooks.before);
  csrsAllService.after(a_hooks.after);

};
