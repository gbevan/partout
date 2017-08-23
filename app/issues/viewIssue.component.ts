import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
// import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  font-size: 120%;
}
  `]
})

export class ViewIssueComponent {
  private issue = {};
  private hourlyLabels: string[] = [];
  private hourlyValues: any = [];

  constructor(
    public dialogRef: MdDialogRef<ViewIssueComponent>,
    public issuesService: IssuesService
  ) {
  }

  setIssue(issue: any) {
    debug('setIssue() issue:', issue);
    this.issue = issue;
    this.hourlyLabels = Object.keys(issue.buckets);
    this.hourlyValues.push({
      data: _.map(issue.buckets, (v, i) => {
        debug('v:', v);
        return v;
      }),
      label: 'count'
    });
    debug('this.hourlyValues:', this.hourlyValues);
  }

}
