/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks,
      ca = new (require('../../../../lib/ca'))();

const debug = require('debug').debug('partout:service:csrs');

exports.before = {
  all: [
    auth.authenticate('jwt'),
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'R'})
  ],
  find: [],
  get: [],
  create: [
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'RW'})
  ],
  patch: [
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'RW'}),
    (hook) => {
      return new Promise((resolve, reject) => {
//        console.log('hook:', hook);

        if (hook.data.status === 'signed' && !hook.data.certPem) {
          debug('signing csr');
          ca.signCsrWithAgentSigner(hook.data.csr, hook.id)  // sign adding key/uuid as given name
          .then(function (signed) {
            debug('Signed cert from csr:\n' + signed.certPem);

            // return to agent via the csr document in db
            hook.data.cert = JSON.parse(JSON.stringify(signed.cert));
            debug('cleansed cert:', hook.data.cert);
            hook.data.certPem = signed.certPem;

//            debug('csr signed, hook:', hook);
            resolve(hook);
          })
          .fail(err => {
            console.error(err);
            reject(err);
          });

        } else if (hook.data.status === 'rejected' && hook.data.certPem) {
//          delete hook.data.cert;
          delete hook.data.certPem;

          resolve(hook);
        } else {
          resolve(hook);
        }
      });
    }
  ],
  update: [
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'RW'})
  ],
  remove: [
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'RW'})
  ],
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
