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

const Waterline = require('waterline'),
      bcrypt = require('bcryptjs');

// Users
// See http://iliketomatoes.com/implement-passport-js-authentication-with-sails-js-0-10-2/
const Users = Waterline.Collection.extend({
  identity: 'users',
  schema: true,
  connection: 'arangodb',

  attributes: {

    id: {
      type: 'string',
      primaryKey: true,
      columnName: '_key'
    },

    provider: { // local, github, etc
      type: 'string'
      //required: true
    },

    username: {
      type: 'string',
      required: true
    },

    password: {
      type: 'string',
      required: true
    },

    name: {
      type: 'string',
      required: true
    },

    avatarUrl: {
      type: 'string'
    },

    roles: {
      type: 'array'
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.password;
      return obj;
    }
  }

});

module.exports = Users;
