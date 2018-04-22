
// Learning from https://github.com/valor-software/ng2-table (MIT License)

import { Component, Input, OnInit } from '@angular/core';

import { Subscriber } from 'rxjs';

import each from 'lodash-es/each';
import get from 'lodash-es/get';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:p2table');

const html = require('./p2table.template.html');
const css = require('./p2table.css');

/*
 * config = {
 *   className: 'optional table class',
 *   columns: [
 *     {
 *       field: 'id',
 *       title: 'ID'
 *     },
 *     {
 *       field: 'ip',
 *       title: 'IP Address'
 *     },
 *     {
 *       field: 'env',
 *       title: 'Environment'
 *     },
 *     {
 *       field: 'lastSeen',
 *       title: 'Last Seen'
 *     }
 *   ]
 * };
 */
@Component({
  selector: 'p2-table',
  template: html,
  styles: [css]
})

export class P2TableComponent {

  @Input() config: any;
  @Input() rxservice: any;  // a feathers-reactive service

  private data: {};
  private currentPage: number;
  private sortBy: string;

  private filters = {};

  private subscriber: Subscriber<any>;

  public constructor() {
    this.data = {};
    this.currentPage = 1;
    this.subscriber = null;
  }

  ngOnInit() {
    this.sortBy = this.config.defaultSortBy;
    this.pageChanged(1);
  }

  setStyles(column, v) {
    if (typeof column.styles === 'function') {
      return column.styles(v) || {};
    } else {
      return column.styles || {};
    }
  }

  private _select() {
    return this.config.columns.map((col) => {
      if (!col.field) {
        return null;
      }
//      const parent_field = (col.field.split(/\./))[0];
//      debug('_select() parent_field:', parent_field);
//      return parent_field;
      if (col.select) {
        return col.select;
      }
      return col.field;
    })
    .filter((f) => f !== null);
  }

  private setWhere(cfg, v) {
    return {
      contains: v,
      caseSensitive: (cfg.hasOwnProperty('caseSensitive') ? cfg.caseSensitive : false)
    };
  }

  private pageChanged(page: any): void {
    debug('pageChanged page:', page);
    let sortBy = {};
    if (typeof(this.sortBy) === 'object') {
      sortBy = this.sortBy;
    } else {
      sortBy[this.sortBy] = 1;
    }

    const where = {};
    debug('pageChanged() filters:', this.filters);
    each(this.filters, (v, k) => {
      debug('where k:', k);
      const levels = k.split(/[.]/);
      debug('where levels:', levels);
      let path;
      const last = levels.pop();
      debug('popped last:', last);
      levels.forEach((l) => {
        debug('l:', l, 'path:', path);
        if (!path) {
          where[l] = {};
          path = l;
        } else {
//          const w = _.get(where, path);
//          w[l] = {};
          path += `.${l}`;
        }
      });

      debug('path after loop:', path, 'where:', where);
      let w = get(where, path);
      debug('w:', w);
      w = w ? w : where;

      w[last] = this.setWhere(this.config, v);
      debug('w:', w);
    });
    debug('pageChanged: where:', where);

    if (this.subscriber) {
      // prevent subscription leaks
      this.subscriber.unsubscribe();
    }

    // subscribe to real-time updates from upstream
    const fields = this._select();
    debug('select fields:', fields);
    this.subscriber = this.rxservice.findRx({
      query: {
        $select: fields,
        $sort: sortBy,
        $skip: (page - 1) * 10,
        where
      }
    })
    .subscribe(
      (data) => {
        debug('Observable data:', data);
        this.data = data;
      },
      (err) => {
        console.error('p2table subscribe err:', err);
      }
    );
  }

  private getValue(r, f) {
    return get(r, f);
  }

}
