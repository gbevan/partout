import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';

import { SocketService,
         UsersService } from '../services/services.module';
import { UserComponent } from '../users/user.component';

import { OkCancelDialogComponent } from '../common/dialogs/ok-cancel-dialog.component';

const debug = require('debug').debug('partout:component:users:tabclass');

/*
 * Define Environments main table view and actions
 */
export class UsersTabClass {

  private config: any = {
    columns: [
      {
        field: 'username',
        title: 'User Name'
      },
      {
        field: 'name',
        title: 'Full Name'
      },
      {
        action: (id) => { this.editUser(id); },
        value: 'Edit'
      },
      {
        action: (id, idx, user) => { this.deleteUser(id, idx, user); },
        value: 'Delete',
        color: 'warn',
        condFn: (row) => {
          const u = this.socketService.getUser();
//          console.log((new Error('condFn')).stack);
//          console.log('id:', id, 'u.id:', u.id);
          return u.id !== row.id; // show if not logged in user
        }
      }
    ],
    defaultSortBy: 'username'
  };

  private dialogRef: MdDialogRef<UserComponent>;

  constructor(
    private usersService: UsersService,
    private dialog: MdDialog,
    private socketService: SocketService
  ) {}

  getConfig() {
    return this.config;
  }

  addUser() {
    const cfg: MdDialogConfig = new MdDialogConfig();
    cfg.disableClose = true;
    this.dialogRef = this.dialog.open(UserComponent, cfg);
  }

  editUser(id: string) {
    this.usersService.get(id, {})
    .then((user) => {
      const cfg: MdDialogConfig = new MdDialogConfig();
      cfg.disableClose = true;
      this.dialogRef = this.dialog.open(UserComponent, cfg);
      this.dialogRef.componentInstance.setUser(user);
    })
    .catch((err) => {
      console.error('editUser() err:', err);
    });
  }

  deleteUser(id: string, idx: number, user: any) {
    console.log('delete user, id:', id, 'user:', user);
    const config: MdDialogConfig = new MdDialogConfig();
    config.data = {
      msg: `Are you sure you want to delete this user - ${user.username}?`
    };
    this.dialog.open(OkCancelDialogComponent, config)
    .afterClosed()
    .subscribe((res) => {
      if (res === 'Ok') {
        this.usersService.remove(id);
      }
    });
  }
}
