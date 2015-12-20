/*jshint esnext: true*/
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

/*jslint node: true, vars: true*/
'use strict';

var Q = require('q');

/**
 * Controller Common prototype for collections.
 *
 * this.__proto__ = Common(db, 'csrs');
 */
var Common = function (db, name) {

  return {
    db: db,
    collectionName: name,
    collection: db.collection(name),


    /*
     * inheritable methods
     */

    /**
     * Check if collection needs creating.
     * @returns {Promise}
     */
    init: function () {
      var self = this,
        deferred = Q.defer();

      self.db.listCollections()
      .then (function (collections) {

        var colExists = (collections.filter(function (d) {
          return d.name === self.collectionName;
        }).length > 0);


        if (colExists) {
          deferred.resolve('exists');
        } else {
          self.collection.create()
          .then(function () {
            console.log(self.collectionName, 'collection:', self.collection);
            deferred.resolve('created');
          });
        }
      });
      return deferred.promise;
    },

    query: function (example) {
      var self = this;
      return self.collection.byExample(example);
    },

    all: function () {
      var self = this,
        deferred = Q.defer();
      //console.log('in csr.all() collection:', self.collection);
      self.collection.all('key')
      .then(function (cursor) {
        //console.log('cursor:', cursor);
        deferred.resolve(cursor.all());
      });
      return deferred.promise;
    },

    save: function (doc) {
      var self = this;
      return self.collection.save(doc);
    },

    update: function (doc) {
      var self = this;
      self.collection.update(doc._id, doc);
    },

    delete: function (key) {
      var self = this;
      return self.collection.removeByKeys([{_key: key}]);
    }

  };
};



module.exports = Common;
