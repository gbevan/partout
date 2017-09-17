import { Component, Inject, OnDestroy } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { Subscriber } from 'rxjs';
import * as _ from 'lodash';

import { EnvironmentsService } from '../../services/services.module';

const debug = require('debug').debug('partout:component:view-log');

/**
 * const cfg: MdDialogConfig = new MdDialogConfig();
 * cfg.data = {
 *   title: 'Pull Results',
 *   rx: {
 *     service: environmentsService,
 *     id: env.id,
 *     field: 'pullOutput'
 *   }
 * };
 * this.dialog.open(ViewLogDialogComponent, cfg);
 */
@Component({
  selector: 'view-log',
  template: `
<h1>{{ title }}</h1>

<pre class="log">{{ log }}</pre>
`,
  styles: [`
.log {
  border: 1px solid #d3d3d3;
  overflow: auto;
  padding: 10px;
}
`]
})

export class ViewLogDialogComponent {
  private subscriber: Subscriber<any>;
  private log: string = '';
  private title: string;

  constructor(
    @Inject(MD_DIALOG_DATA) private data: any
  ) {
    this.init();
  }

  ngOnDestroy() {
    if (this.subscriber) {
      this.subscriber.unsubscribe();
    }
  }

  init() {
    this.title = this.data.title || 'Log';

    if (!this.data.rx) {
      throw new Error('view-log-dialog called without data.rx');
    }

    this.subscriber = this.data.rx.service
    .findRx({query: {id: this.data.rx.id}})
    .subscribe((res) => {
      debug('res:', res);
      if (res.total === 1) {
        this.log = res.data[0][this.data.rx.field];
      } else if (res.total > 1) {
        throw new Error('view-log-dialog rx query returned > 1 result on subscribe');
      } else {
        this.log = 'Document not available';
      }
    });
  }
}
