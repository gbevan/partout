/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks,
      ca = new (require('../../../../lib/ca'))();

const debug = require('debug').debug('partout:service:csrs');

exports.before = {
  all: [
    auth.authenticate('jwt')
  ],
  find: [],
  get: [],
  create: [],
  update: [
    (options) => {
      return new Promise((resolve, reject) => {

        if (options.data.status === 'signed' && !options.data.cert) {
          debug('signing csr');
          ca.signCsrWithAgentSigner(options.data.csr, options.data.id)  // sign adding key/uuid as given name
          .then(function (signed) {
            debug('Signed cert from csr:\n' + signed.certPem);

            // return to agent via the csr document in db
            options.data.cert = signed.cert;
            options.data.certPem = signed.certPem;

//                  console.log('csr signed, options:', options);
            resolve(options);
          })
          .fail(err => {
            console.error(err);
            reject(err);
          });

        } else if (options.data.status === 'rejected' && options.data.cert) {
          delete options.data.cert;
          delete options.data.certPem;

          resolve(options);
        } else {
          resolve();
        }
      });
    }
  ],
  patch: [],
  remove: [],
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [
    (hook) => {
      hook.app.service('csrs_all').emit('created', []); // tell csrs_all
    }
  ],
  update: [
    (hook) => {
      hook.app.service('csrs_all').emit('updated', []); // tell csrs_all
    }
  ],
  patch: [
    (hook) => {
      hook.app.service('csrs_all').emit('updated', []); // tell csrs_all
    }
  ],
  remove: [
    (hook) => {
      hook.app.service('csrs_all').emit('removed', []); // tell csrs_all
    }
  ],
};
