import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import * as _ from 'lodash';

import { UsersService,
         RolesAllService} from '../services/services.module';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:component:user');

const html = require('./user.template.html');

@Component({
  selector: 'user-dialog',
  template: html,
  styles: [`
.errmsg {
  color: red;
}

.roles th {
  border-bottom: 1px solid #a2a2a2;
  margin-right: 2px;
  padding: 3px;
}

.roles td {
  border-left: 1px solid #a2a2a2;
  border-right: 1px solid #a2a2a2;
  margin-top: 2px;
  padding: 3px;
}

.roles md-select {
  width: 280px;
}

.list
  overflow-y: scroll;
}

md-dialog-actions div {
  display: block;
}

`]
})

export class UserComponent {
  private user: any = {};
  private password1: string;
  private password2: string;
  private errmsg: string = '';
  private roles: any[] = [];

  constructor(
    private dialogRef: MdDialogRef<UserComponent>,
    private usersService: UsersService,
    private rolesAllService: RolesAllService
  ) {
    this.getRoles();
  }

  getRoles() {
    this.roles = [];
    this.rolesAllService.find()
    .then((r_res) => {
      this.roles = r_res;
    });
  }

  setUser(user) {
    debug('setUser() user:', user);
    this.user = user;
    this.getRoles();
  }

  addRole() {
    if (!this.user.roles) {
      this.user.roles = [];
    }
    this.user.roles.push({});
    debug('addRole user.roles:', this.user.roles);
    debug('addRole roles:', this.roles);
  }

  deleteRole(i) {
    this.user.roles.splice(i, 1);
  }

  save() {
    debug('save()');
    if (this.user.id) {
      debug('updating');
      this.usersService.patch(this.user.id, this.user)
      .then((patcheduser) => {
        console.log('user updated:', patcheduser);
        this.dialogRef.close();
      })
      .catch((err) => {
        console.error('user err:', err);
        this.errmsg = err;
      });

    } else {
      debug('creating');

      this.usersService.create(this.user)
      .then((newuser) => {
        console.log('user created:', newuser);
        this.dialogRef.close();
      })
      .catch((err) => {
        console.error('user err:', err);
        this.errmsg = err;
      });
    }
  }
}
