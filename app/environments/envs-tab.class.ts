import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';

import { EnvironmentsService } from '../services/services.module';
import { EnvRepoMgmtComponent } from '../environments/env-repo-mgmt.component';
import { ViewLogDialogComponent } from '../common/dialogs/view-log-dialog.component';

const debug = require('debug').debug('partout:component:environments:tabclass');

/*
 * Define Environments main table view and actions
 */
export class EnvironmentsTabClass {

  private config: any = {
    columns: [
      {
        field: 'name',
        title: 'Name'
//        action: (id) => { this.envRepoMgmt(id); }
      },
      {
        field: 'description',
        title: 'Description'
      },
      {
        field: 'keyType',
        title: 'Key Type',
        type: 'chip'
      },
      {
        field: 'cloneStatus',
        title: 'Cloned?',
        type: 'chip'
      },
      {
        action: (id) => { this.pull(id); },
        value: 'Pull',
        condFn: (row) => row.cloneStatus === 'cloned'
      },
      {
        action: (id) => { this.envRepoMgmt(id); },
        value: 'Edit'
      },
      {
        action: (id) => { this.deleteEnv(id); },
        value: 'Delete',
        color: 'warn'
      }
    ],
    defaultSortBy: 'name'
  };

  private dialogRef: MdDialogRef<EnvRepoMgmtComponent>;

  constructor(
    private environmentsService: EnvironmentsService,
    private dialog: MdDialog
  ) {}

  getConfig() {
    return this.config;
  }

  envRepoMgmt(id: string) {
    debug('envRepoMgmt() id:', id);

    this.environmentsService.get(id, {})
    .then((env) => {
      const cfg: MdDialogConfig = new MdDialogConfig();
      cfg.disableClose = true;
      this.dialogRef = this.dialog.open(EnvRepoMgmtComponent, cfg);
      this.dialogRef.componentInstance.setEnv(env);
    })
    .catch((err) => {
      console.error('envRepoMgmt() err:', err);
    });
  }

  addEnv() {
    const cfg: MdDialogConfig = new MdDialogConfig();
    cfg.disableClose = true;
    this.dialogRef = this.dialog.open(EnvRepoMgmtComponent, cfg);
    this.dialogRef.componentInstance.setEnv({});
  }

  deleteEnv(id) {
    this.environmentsService.remove(id, {})
    .then((env) => {
      console.log('deleteEnv() env:', env);
    })
    .catch((err) => {
      console.error('deleteEnv() err:', err);
    });
  }

  pull(id) {
    debug('pull() id:', id);
    this.environmentsService
    .patch(id, {pullRequest: true})
    .then((res) => {
      debug('pull request submit res:', res);

      // track pull progress
      const cfg: MdDialogConfig = new MdDialogConfig();
      cfg.data = {
        title: 'Pull Results',
        rx: {
          service: this.environmentsService,
          id,
          field: 'pullOutput'
        }
      };
      this.dialog.open(ViewLogDialogComponent, cfg);
    });
  }
}
