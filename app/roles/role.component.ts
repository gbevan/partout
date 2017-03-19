import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import * as _ from 'lodash';

import { RolesService } from '../services/roles.service';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:component:role');

const html = require('./role.template.html');

@Component({
  selector: 'role-dialog',
  template: html,
  styles: [`
.errmsg {
  color: red;
}
  `]
})

export class RoleComponent {
  private role: any = {};
  private errmsg: string = '';

  constructor(
    private dialogRef: MdDialogRef<RoleComponent>,
    private rolesService: RolesService
  ) { }

  setRole(role) {
    debug('setRole() user:', role);
    this.role = role;
  }

  addPermission() {
    if (!this.role.permissions) {
      this.role.permissions = [];
    }
    this.role.permissions.push('');
  }

  save() {
    debug('save()');
    if (this.role.id) {
      debug('updating');
      this.rolesService.patch(this.role.id, this.role)
      .then((patchedrole) => {
        console.log('role updated:', patchedrole);
        this.dialogRef.close();
      })
      .catch((err) => {
        console.error('role err:', err);
        this.errmsg = err;
      });

    } else {
      debug('creating');

      this.rolesService.create(this.role)
      .then((newrole) => {
        console.log('role created:', newrole);
        this.dialogRef.close();
      })
      .catch((err) => {
        console.error('role err:', err);
        this.errmsg = err;
      });
    }
  }
}
