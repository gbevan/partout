import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import * as _ from 'lodash';

const html = require('./env-repo-mgmt.template.html');

const debug = require('debug').debug('partout:component:user');

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
`]
})

export class EnvRepoMgmtComponent {
  private env: any = {};

  constructor(public dialogRef: MdDialogRef<EnvRepoMgmtComponent>) {
  }

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
}
