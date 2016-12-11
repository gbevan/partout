// Learning from https://github.com/valor-software/ng2-table (MIT License)

import { Component, Input, OnInit } from '@angular/core';
//import { PaginationModule } from 'ng2-bootstrap/ng2-bootstrap';

// import { AppModule } from './app.module';

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
        {{ column.title }}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let row of rows; let idx=index">
      <td *ngFor="let column of config.columns">

        <button md-raised-button
                class="p2TableFieldActionButton"
                *ngIf="column.action && column.field"
                (click)="column.action(row.id)">{{ row[column.field] }}</button>

        <button md-raised-button
                *ngIf="column.action && column.value"
                color="warn"
                (click)="column.action(row.id, idx)">{{ column.value }}</button>

        <span *ngIf="!column.action"
              [ngStyle]="setStyles(column)">{{ row[column.field] }}</span>
      </td>
    </tr>
  </tbody>
</table>

`,
  styles: [`
.p2Table {
  margin-top: 5px;
  width: 100%;
}
.p2Heading {
  background-color: darkgray;
}
.p2TableFieldActionButton {
  font-family: monospace;
}
`]
})

export class P2TableComponent {

  @Input() config: Object;
  @Input() rows: Array<any>;

  public constructor() {
  }

  setStyles(column) {
    return column.styles || {};
  }

}
