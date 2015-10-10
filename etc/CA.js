/*jslint node: true */
'use strict';

var os = require('os');

var Ca = function () {
  var self = this;

  // CA Root cert cfg
  self.ca_root = {
    attrs: [{
      name: 'commonName',
      value: 'Partout CA Root'
    }, {
      shortName: 'OU',
      value: 'Partout'
    }],
    serialNumber: '01',
    maxAge: 50,
    keySize: 4096
  };

  // CA Intermediate cert cfg
  self.ca_int = {
    attrs: [{
      name: 'commonName',
      value: 'Partout CA Intermediate'
    }, {
      shortName: 'OU',
      value: 'Partout'
    }],
    serialNumber: '01',
    maxAge: 50,
    keySize: 4096
  };

  // Agent Signer cert cfg
  self.agentsigner = {
    attrs: [{
      name: 'commonName',
      value: 'Partout Agent Signer'
    }, {
      shortName: 'OU',
      value: 'Partout'
    }],
    serialNumber: '01',
    maxAge: 25,
    keySize: 2048
  };

  // Master API cert cfg
  self.masterapi = {
    attrs: [{
      name: 'commonName',
      value: os.hostname()
    }, {
      shortName: 'OU',
      value: 'Partout'
    }],
    serialNumber: '01',
    maxAge: 25,
    keySize: 2048
  };

  // Master API cert cfg
  self.masterui = {
    attrs: [{
      name: 'commonName',
      value: os.hostname()
    }, {
      shortName: 'OU',
      value: 'Partout'
    }],
    serialNumber: '01',
    maxAge: 25,
    keySize: 2048
  };

};

module.exports = Ca;
