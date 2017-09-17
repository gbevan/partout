#!/usr/bin/env node

const console = require('better-console');
const Q = require('q');
Q.longStackSupport = true;
const prompt = require('prompt');
const colors = require('colors/safe');
const bc = require('bcryptjs');

const Waterline = require('waterline');
const orm = new Waterline();
const adapter = require('@partoutx/sails-arangodb');

const cfg = new (require('../etc/partout.conf.js'))();

const Users = require('../server/services/users/users-model.js');

const dbConfig = {
  adapters: {
    'default': adapter,
    arangodb: adapter
  }
};
Object.assign(dbConfig, cfg.waterline_config);

const promptSchema = {
  properties: {
    username: {
      pattern: /^\w+$/,
      message: 'Invalid character(s) in username',
      required: true
    },
    name: {
      pattern: /^[\w \-]+$/,
      message: 'Invalid character(s) in username',
      required: true
    },
    password: {
      hidden: true,
      replace: '*'
    },
    role: {
      pattern: /^\w+$/,
      message: 'Invalid characters in role'
    }
  }
};
prompt.message = colors.bgWhite(colors.black(' Partout '));

let models;
let user;

orm.loadCollection(Users);
Q.ninvoke(orm, 'initialize', dbConfig)
.then((o) => {
//  console.log('o:', o);
  models = o.collections;
//  const connections = o.connections;

  prompt.start();
  return Q.ninvoke(prompt, 'get', promptSchema);
})
.then((uEntered) => {
  user = uEntered;
  // generate salt for the pw hash
  return Q.ninvoke(bc, 'genSalt', 10);
})
.then((s) => {
  // hash the password
  return Q.ninvoke(bc, 'hash', user.password, s);
})
.then((pw) => {
  user.password = pw;
  return models.users.create(user);
})
.then((newUser) => {
  console.info('User created:', newUser);
})
.catch((err) => {
  console.error(err);
  return;
});
