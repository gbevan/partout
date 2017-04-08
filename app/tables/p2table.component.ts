
// Learning from https://github.com/valor-software/ng2-table (MIT License)

import { Component, Input, OnInit } from '@angular/core';
import { SocketService } from '../services/feathers.service';

import { Subscriber } from 'rxjs';

import * as _ from 'lodash';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:p2table');

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
  template: `

<table class="table p2Table"
       ngClass="{{config.className || ''}}">
  <thead>
    <tr>
      <th *ngFor="let column of config.columns"
          class="p2Heading"
          ngClass="{{column.className || ''}}">
        <md-input-container>
          <input mdInput type="text"
                    placeholder="{{ column.title }}"
                    [(ngModel)]="filters[column.field]"
                    (keyup)="pageChanged($event)">
        </md-input-container>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let row of data.data; let idx=index">
      <td *ngFor="let column of config.columns" class="p2Row">

        <button md-raised-button
                class="p2TableFieldActionButton"
                *ngIf="column.action && column.field"
                [ngStyle]="setStyles(column)"
                (click)="column.action(row.id)">{{ getValue(row, column.field) }}</button>

        <button md-raised-button
                *ngIf="column.action && column.value && (!column.condFn || column.condFn(row.id))"
                [ngStyle]="setStyles(column)"
                color="warn"
                (click)="column.action(row.id, idx)">{{ column.value }}</button>

        <img *ngIf="!column.action && column.imgsrc && column.imgsrc != ''"
              [ngStyle]="setStyles(column)"
              src="{{ column.imgsrc(row) }}">

        <div *ngIf="!column.action && !column.imgsrc"
              [ngStyle]="setStyles(column, getValue(row, column.field))">

          <div [ngSwitch]="column.pipe">
            <span *ngSwitchCase="'datetime'">
              {{ (column.valueFn ? column.valueFn(row[column.field]) : getValue(row, column.field)) | date:'dd-MMM-y HH:mm:ss' }}
            </span>
            <span *ngSwitchDefault>
              {{ column.valueFn ? column.valueFn(row[column.field]) : getValue(row, column.field) }}
            </span>
          </div>

        </div>
      </td>
    </tr>
  </tbody>
</table>
<div class="p2Pager">
  <pagination [(ngModel)]="currentPage"
              [totalItems]="data.total"
              (pageChanged)="pageChanged($event)"></pagination>
</div>

`,
  styles: [`
.p2Table {
  margin-top: 15px;
  width: 100%;
}
.p2Heading {
  /*background-color: white;*/
  color: black;
}
.p2Row {
  vertical-align: middle;
}
.p2TableFieldActionButton {
  font-family: monospace;
}
.p2Pager {
  text-align: center;
}
`]
})

export class P2TableComponent {

  @Input() config: any;
  @Input() rxservice: any;  // a feathers-reactive service

  private data: Object;
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
    this.pageChanged({page: 1, itemsPerPage: 10});
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

  private pageChanged(event: any): void {
    const sortBy = {};
    sortBy[this.sortBy] = 1;

    const where = {};
    _.each(this.filters, (v, k) => {
      debug('where k:', k);
      const levels = k.split(/[.]/);
      debug('where levels:', levels);
      let path;
      const last = levels.pop();
      levels.forEach((l) => {
        if (!path) {
          where[l] = {};
          path = l;
        } else {
          const w = _.get(where, path);
          w[l] = {};
          path += `.${l}`;
        }
      });

      const w = _.get(where, path);
      debug('w:', w);
      w[last] = this.setWhere(this.config, v);
      debug('w:', w);

//      where[k] = {
//        contains: v,
//        caseSensitive: (this.config.hasOwnProperty('caseSensitive') ? this.config.caseSensitive : false)
//      };
    });
    debug('pageChanged: where:', where);

    if (this.subscriber) {
      // prevent subscription leaks
      this.subscriber.unsubscribe();
    }

    // subscribe to real-time updates from upstream
    const fields = this._select();
    debug('select fields:', fields);
    this.subscriber = this.rxservice.find({
      query: {
        $select: fields,
        $sort: sortBy,
        $skip: (event.page - 1) * event.itemsPerPage,
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
    return _.get(r, f);
  }

}
