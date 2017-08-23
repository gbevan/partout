/*jshint node: true*/
'use strict';

const debug = require('debug').debug('partout:issues');

class Issues {
  constructor(app) {
    debug('Issues constructor called');
    debug('this name:', this.constructor.name);
    this.app = app;
  }

  report_issue(err) {
    let issue = {};

    if (typeof(err) === 'string') {
      issue.message = err;
    } else {
      issue = err;
    }

    if (!issue.stack) {
      Error.captureStackTrace(issue, this.report_issue);
    }

    debug('issue.message:', issue.message);
//    debug('issue.stack:', issue.stack);

    this.app.service('issues')
    .find({query: {
      message: issue.message
//      stack: issue.stack
    }})
    .then((res) => {
      debug('issues res:', res);
      if (res.total === 0) {
        const buckets = {};
        const now = new Date();
        buckets[`hour_${now.getHours()}`] = 1;

        return this.app.service('issues')
        .create({
          message: issue.message,
          stack: issue.stack,
          count: 1,
          buckets: buckets
        });

      } else {
        res.data[0].count += 1;

        const now = new Date();
        if (!res.data[0].buckets[`hour_${now.getHours()}`]) {
          res.data[0].buckets[`hour_${now.getHours()}`] = 1;
        } else {
          res.data[0].buckets[`hour_${now.getHours()}`] += 1;
        }

        return this.app.service('issues')
        .patch(res.data[0].id, {
          count: res.data[0].count,
          buckets: res.data[0].buckets,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
    return issue;
  }
}

module.exports = Issues;
