import { MdDialog,
         MdDialogRef,
         MdDialogConfig } from '@angular/material';

import { IssuesService } from '../services/services.module';
import { ViewIssueComponent } from './viewIssue.component';

const debug = require('debug').debug('partout:component:issues:tabclass');

/*
 * Define Environments main table view and actions
 */
export class IssuesTabClass {

  private config: any = {
    columns: [
      {
        field: 'message',
        title: 'Message',
        styles: {
          'font-size': '120%',
          'color': 'red',
          'line-height': 'normal',
          'text-align': 'left',
          'padding-top': '10px',
          'padding-bottom': '10px',
          'white-space': 'pre-wrap'
        },
        action: (id) => { this.viewIssue(id); }
      },
      {
        field: 'count',
        title: 'Count'
      },
      {
        field: 'createdAt',
        title: 'First Seen',
        pipe: 'datetime'
      },
      {
        field: 'updatedAt',
        title: 'Last Seen',
        pipe: 'datetime'
      },
      {
        action: (id, index) => { this.clearIssue(id, index); },
        value: 'Clear',
        color: 'warn'
      }
    ],
    defaultSortBy: {count: -1}
  };

  private dialogRef: MdDialogRef<ViewIssueComponent>;

  constructor(
    private issuesService: IssuesService,
    private dialog: MdDialog,
//    private socketService: SocketService
  ) {}

  getConfig() {
    return this.config;
  }

  viewIssue(id) {
    this.issuesService.get(id, {})
    .then((issue) => {
      console.log('issue:', issue);
      const dlgCfg: MdDialogConfig = new MdDialogConfig();
//      dlgCfg.width = '80%';
//      dlgCfg.height = '80%';
      this.dialogRef = this.dialog.open(ViewIssueComponent, dlgCfg);
      this.dialogRef.componentInstance.setIssue(issue);
    })
    .catch((err) => {
      console.error('viewIssue() err:', err);
    });
  }

  clearIssue(id, index) {
    this.issuesService.remove(id)
    .then((issue) => {
      console.log('clearIssue() issue:', issue, 'index:', index);
    })
    .catch((err) => {
      console.error('clearIssue() err:', err);
    });
  }
}
