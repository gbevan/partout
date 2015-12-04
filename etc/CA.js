/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>

    This file is part of Partout.

    Partout is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*jslint node: true */
'use strict';

var os = require('os');

//var hostname = os.hostname();
var hostname = 'officepc.net';

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
    maxAge: 25,
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
    maxAge: 25,
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
      value: hostname
    }, {
      shortName: 'OU',
      value: 'Partout Master API'
    }],
    serialNumber: '01',
    maxAge: 25,
    keySize: 2048
  };

  // Master UI cert cfg
  self.masterui = {
    attrs: [{
      name: 'commonName',
      value: hostname
    }, {
      shortName: 'OU',
      value: 'Partout Master UI'
    }],
    serialNumber: '01',
    maxAge: 25,
    keySize: 2048
  };

};

module.exports = Ca;
