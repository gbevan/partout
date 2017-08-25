import { Component,
         Input,
         OnInit,
         OnDestroy } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { Subscriber } from 'rxjs';
import * as _ from 'lodash';

import { IssuesService,
         EnvironmentsService } from '../services/services.module';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:viewIssue');

const html = require('./viewIssue.template.html');

@Component({
  selector: 'view-issue-dialog',
  template: html,
  styles: [`
.message {
  color: red;
  font-family: monospaced;
  font-size: 80%;
  line-height: normal;
  margin-bottom: 10px;
  white-space: pre-wrap;
}
.stack {
  font-size: 80%;
}
`]
})

export class ViewIssueComponent implements OnInit, OnDestroy {
  private issue: any = {};
  private hourlyLabels: string[] = [];
  private hourlyValues: any = [];

  private subscriber: Subscriber<any>;

  constructor(
    private dialogRef: MdDialogRef<ViewIssueComponent>,
    private issuesService: IssuesService,
  ) {
  }

  initHourlyValues() {
    this.hourlyValues = [{
      data: [],
      label: 'count'
    }];
  }

  ngOnInit() {
    this.hourlyLabels = [];
    _.range(0, 23).forEach((hour) => {
      this.hourlyLabels.push(`hour_${hour}`);
    });
    this.initHourlyValues();
  }

  setIssue(issue: any) {
    debug('setIssue() issue:', issue);

    if (this.subscriber) {
      // prevent subscription leaks
      this.subscriber.unsubscribe();
    }

    this.subscriber = this.issuesService
    .get(issue.id)
    .subscribe((s_issue) => {
      this.issue = s_issue;
      this.initHourlyValues();
      this.hourlyValues[0].data = [];
      this.hourlyLabels.forEach((hour) => {
        this.hourlyValues[0].data.push(this.issue.buckets[hour]);
      });
      debug('this.hourlyLabels:', this.hourlyLabels);
      debug('this.hourlyValues:', this.hourlyValues);
    },
    (err) => {
      console.error('viewissue subscribe err:', err);
    });
  }

  ngOnDestroy() {
    if (this.subscriber) {
      // prevent subscription leaks
      this.subscriber.unsubscribe();
    }
  }

}
