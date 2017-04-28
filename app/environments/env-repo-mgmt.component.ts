import { Component, Input } from '@angular/core';
import { MdDialog, MdDialogConfig, MdDialogRef } from '@angular/material';
import * as _ from 'lodash';

import { EnvironmentsService } from '../services/services.module';

import { ViewLogDialogComponent } from '../common/dialogs/view-log-dialog.component';

const html = require('./env-repo-mgmt.template.html');

const debug = require('debug').debug('partout:component:environments');

@Component({
  selector: 'env-repo-mgmt',
  template: html,
  styles: [`
md-input-container {
  display: table;
}
.key {
  background-color: #eaeaea;
  font-family: monospace;
  font-size: 50%;
}
.actionsRow {
  width: 100%;
}
.errmsg {
  color: red;
  font-weight: bold;
  text-align: center;
}
.label {
  color: rgba(0, 0, 0, 0.38);
}
`]
})

export class EnvRepoMgmtComponent {
  private env: any = {};
  private errmsg: string = '';

  constructor(
    private dialogRef: MdDialogRef<EnvRepoMgmtComponent>,
    private environmentsService: EnvironmentsService,
    private dialog: MdDialog
  ) { }

  setEnv(env: any) {
    this.env = env;

    if (!this.env.keyType) {
      this.env.keyType = 'text';
    }

    if (!this.env.branchtag) {
      this.env.branchtag = 'master';
    }

    debug('env:', this.env);
  }

  setCloneStatus(checkboxChange) {
    debug('setCloneStatus checkboxChange:', checkboxChange);
    if (checkboxChange.checked) {
      this.env.cloneStatus = 'cloned';
    } else {
      this.env.cloneStatus = '';
    }
  }

  save() {
    debug('save env:', this.env);

    if (this.env.id) {
      // Existing repo
      this.environmentsService
      .patch(this.env.id, this.env)
      .then((res) => {
        debug('save env returned from patch:', res);
        this.dialogRef.close();
      })
      .catch((err: Error) => {
        console.error(err);
        this.errmsg = err.message;
      });

    } else {
      // New Repo
      this.environmentsService
      .create(this.env)
      .then((res) => {
        debug('save env returned from create:', res);
        this.dialogRef.close();

        // Track clone progress
        const cfg: MdDialogConfig = new MdDialogConfig();
        cfg.data = {
          title: 'Clone Results',
          rx: {
            service: this.environmentsService,
            id: res.id,
            field: 'cloneOutput'
          }
        };
        this.dialog.open(ViewLogDialogComponent, cfg);
      })
      .catch((err: Error) => {
        console.error(err);
        this.errmsg = err.message;
      });
    }
  }
}
