/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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
/*jshint esversion: 6 */
'use strict';

const Waterline = require('waterline');

// Environments
const Environments = Waterline.Collection.extend({
  identity: 'environments',
  schema: true,
  connection: 'arangodb',
  attributes: {

    id: {
      type: 'string',
      primaryKey: true,
      columnName: '_key'
    },
    name: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string'
    },
    url: {
      type: 'string'
    },
    branchtag: {
      type: 'string',
      default: 'master'
    },
    keyType: {
      type: 'string',  // 'file' or 'text'
      default: "text"
    },
    key: {
      type: 'string'  // depends on keyType, file-path vs text of private ro key
    }
    // TODO: GitHub url etc for clone of site manifest project
  }
});

module.exports = Environments;
