import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import * as _ from 'lodash';

import { EnvironmentsService } from '../services/services.module';

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
}
`]
})

export class EnvRepoMgmtComponent {
  private env: any = {};
  private errmsg: string = '';

  constructor(
    private dialogRef: MdDialogRef<EnvRepoMgmtComponent>,
    private environmentsService: EnvironmentsService
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

  save() {
    debug('save');
    this.environmentsService
    .patch(this.env.id, this.env)
    .then(() => {
      this.dialogRef.close();
    })
    .catch((err: Error) => {
      console.error(err);
      this.errmsg = err.message;
    });
  }
}
