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

var Q = require('q'),
    assert = require('assert'),
    _ = require('lodash');

/**
 * Controller Common prototype for collections.
 *
 * Object.setPrototypeOf(self, Common(db, 'csrs'));
 */
var Common = function (db, name) {
  var self = this;

  self.db = db;
  self.collectionName = name;
  self.collection = db.collection(name);

  //console.log('Common constructor db:', self.db);

  if (self.schema) {
    self.schema._id = true;
    self.schema._key = true;
  }

  return self;
};

/**
 * Validate a document against a defined schema
 * @private
 * @param   {object}  doc Document to validate
 * @returns {boolean} true/false valid or not
 */
Common.prototype._validDoc = function (doc) {
  var self = this,
      valid = true;

  /*
   * add missing / assumed fields
   */
  var assumed = {
    _id: 'string',
    _key: 'string',
    _rev: 'string'
  };
  _.merge(self.schema, assumed);

  if (self.schema) {
    _.forIn(doc, function (v, k) {
      if (!_.hasIn(self.schema, k)) {
        console.warn('_validDoc encounterd:', k);
        valid = false;
      }
    });
  }

  return valid;
};

/**
 * Drop this collection
 * @returns {promise}
 */
Common.prototype.drop = function () {
  var self = this;
  if (self.collection) {
    return self.collection.drop()
    .then(function () {
      self.collection = null;
      return Q.resolve();
    });
  } else {
    return Q.resolve();
  }
};

/**
 * Check if collection needs creating.
 * @returns {Promise}
 */
Common.prototype.init = function () {
  var self = this;

  //console.log('init for collection:', self.collectionName);
  self.collection = self.db.collection(self.collectionName);

  return self.db.listCollections()
  .then(function (collections) {
    //console.log('collections:', collections);
    var colExists = false;

    if (collections) {
      colExists = (collections.filter(function (d) {
        return d.name === self.collectionName;
      }).length > 0);
    }

    if (colExists) {
      return Q.resolve('exists');
    } else {
      //console.log('calling create');
      return self.collection.create()
      .then(function () {
        //console.log(self.collectionName, 'collection:', self.collection);
        //console.info('Collection', self.collectionName, 'created');
        return Q.resolve('created');
      });
    }
  });
};

/**
 * Query by example document
 * @param   {Object} example
 * @returns {Object} arangojs cursor
 */
Common.prototype.query = function (example) {
  var self = this;
  return self.collection.byExample(example);
};

Common.prototype.queryOne = function (example) {
  var self = this,
    deferred = Q.defer();

  self.query(example)
  .then(function (cursor) {
    //console.log('cursor:', cursor);
    if (cursor.count > 1) {
      throw new Error('queryOne returned more than 1 result');
    }
    if (cursor.count === 1) {
      cursor.next()
      .then(function (doc) {
        //console.log('doc:', doc);
        deferred.resolve(doc);
      })
      .done();
    } else {
      deferred.resolve();
    }
  })
  .fail(function (err) {
    console.error('Query failed for doc:', example, 'err:', err);
    deferred.reject(err);
  })
  .done();
  return deferred.promise;
};

Common.prototype.all = function () {
  var self = this,
    deferred = Q.defer();
  //console.log('in csr.all() collection:', self.collection);
  self.collection.all('key')
  .then(function (cursor) {
    //console.log('cursor:', cursor);
    deferred.resolve(cursor.all());
  })
  .fail(function (err) {
    console.error('all() failed for collection:', self.collectionName, 'err:', err);
    deferred.reject(err);
  })
  .done();
  return deferred.promise;
};

Common.prototype.save = function (doc) {
  var self = this;
  if (!self._validDoc(doc)) {
    return Q.reject(new Error('Invalid document'));
  }
  return self.collection.save(doc);
};

Common.prototype.update = function (doc) {
  var self = this;
  if (!self._validDoc(doc)) {
    return Q.reject(new Error('Invalid document'));
  }
  return self.collection.update(doc._id, doc, {mergeObjects: false});
};

Common.prototype.delete = function (key) {
  var self = this;
  return self.collection.removeByKeys([{_key: key}]);
};

Common.prototype.deleteAll = function () {
  var self = this;
  return self.collection.truncate();
};

Common.prototype.upsert = function (doc) {
  var self = this;
  assert(doc !== undefined);
  assert(doc._key !== undefined && doc._key !== '');

  if (!self._validDoc(doc)) {
    return Q.reject(new Error('Invalid document'));
  }

  return self.queryOne({_key: doc._key})
  .then(function (existing_doc) {
    if (existing_doc) {
      // Update
      doc._id = existing_doc._id;
      return self.update(doc);
    } else {
      // create
      return self.save(doc);
    }
  });
};

module.exports = Common;
