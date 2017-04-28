
// Learning from https://github.com/valor-software/ng2-table (MIT License)

import { Component, Input, OnInit } from '@angular/core';

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
                *ngIf="column.action && column.value && (!column.condFn || column.condFn(row))"
                [ngStyle]="setStyles(column)"
                [color]="column.color || 'primary'"
                (click)="column.action(row.id, idx)">{{ column.value }}</button>

        <img *ngIf="!column.action && column.imgsrc && column.imgsrc != ''"
              [ngStyle]="setStyles(column)"
              src="{{ column.imgsrc(row) }}">

        <div *ngIf="!column.action && !column.imgsrc"
              [ngStyle]="setStyles(column, getValue(row, column.field))">

          <div [ngSwitch]="column.pipe">
            <span *ngSwitchCase="'datetime'">
              {{ (column.valueFn ? column.valueFn(row[column.field]) :
                  getValue(row, column.field)) | date:'dd-MMM-y HH:mm:ss' }}
            </span>
            <span *ngSwitchDefault>
              <span [ngSwitch]="column.type">
                <span *ngSwitchCase="'chip'">
                  <md-chip-list *ngIf="column.valueFn ? column.valueFn(row[column.field]) :
                                        getValue(row, column.field)">
                  <md-chip color="{{ column.color || 'accent' }}">
                    {{ column.valueFn ? column.valueFn(row[column.field]) : getValue(row, column.field) }}
                  </md-chip>
                  </md-chip-list>
                </span>
                <span *ngSwitchDefault>
                  {{ column.valueFn ? column.valueFn(row[column.field]) : getValue(row, column.field) }}
                </span>
              </span>
            </span>
          </div>

        </div>
      </td>
    </tr>
  </tbody>
</table>
<ngb-pagination [(page)]="currentPage"
                [collectionSize]="data.total"
                [pageSize]="10"
                [maxSize]="5"
                [boundaryLinks]="true"
                [rotate]="true"
                (pageChange)="pageChanged($event)"
                class="p2Pager"></ngb-pagination>

`,
  styles: [`
.p2Table {
  margin-top: 15px;
  width: 100%;
}
.p2Heading {
  /*background-color: white;*/
  color: black;
  font-size: 80%;
}
.p2Row {
  font-size: 70%;
  vertical-align: middle;
}
.p2TableFieldActionButton {
  font-family: monospace;
}
.p2Pager {
  display: table;
  margin-left: auto;
  margin-right: auto;
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
    const sortBy = {};
    sortBy[this.sortBy] = 1;

    const where = {};
    debug('pageChanged() filters:', this.filters);
    _.each(this.filters, (v, k) => {
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
          const w = _.get(where, path);
          w[l] = {};
          path += `.${l}`;
        }
      });

      debug('path after loop:', path, 'where:', where);
      let w = _.get(where, path);
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
    this.subscriber = this.rxservice.find({
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
    return _.get(r, f);
  }

}
