import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import * as _ from 'lodash';

import { UsersService } from '../services/users.service';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:user');

const html = require('./user.template.html');

@Component({
  selector: 'user-dialog',
  template: html,
  styles: [`
.errmsg {
  color: red;
}
  `]
})

export class UserComponent {
  private user: any = {};
  private password1: string;
  private password2: string;
  private errmsg: string = '';

  constructor(
    private dialogRef: MdDialogRef<UserComponent>,
    private usersService: UsersService
  ) { }

  setUser(user) {
    debug('setUser() user:', user);
    this.user = user;
  }

  save() {
    debug('save()');
    if (this.user.id) {
      this.usersService.patch(this.user.id, this.user)
      .then(() => {
        console.log('user updated');
        this.dialogRef.close();
      })
      .catch((err) => {
        console.error('user err:', err);
        this.errmsg = err;
      });

    } else {

      this.usersService.create(this.user)
      .then(() => {
        console.log('user created');
        this.dialogRef.close();
      })
      .catch((err) => {
        console.error('user err:', err);
        this.errmsg = err;
      });
    }
  }
}
