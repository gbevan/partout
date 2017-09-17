import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';

import { RolesService } from '../services/services.module';
import { RoleComponent } from '../roles/role.component';

import { OkCancelDialogComponent } from '../common/dialogs/ok-cancel-dialog.component';

const debug = require('debug').debug('partout:component:roles:tabclass');

/*
 * Define Environments main table view and actions
 */
export class RolesTabClass {

  private config: any = {
    columns: [
      {
        field: 'name',
        title: 'Role Name'
      },
      {
        field: 'description',
        title: 'Description'
      },
      {
        action: (id) => { this.editRole(id); },
        value: 'Edit'
      },
      {
        action: (id, idx, role) => { this.deleteRole(id, idx, role); },
        value: 'Delete',
        color: 'warn'
      }
    ],
    defaultSortBy: 'name'
  };

  private dialogRef: MdDialogRef<RoleComponent>;

  constructor(
    private rolesService: RolesService,
    private dialog: MdDialog,
//    private socketService: SocketService
  ) {}

  getConfig() {
    return this.config;
  }

  addRole() {
    const cfg: MdDialogConfig = new MdDialogConfig();
    cfg.disableClose = true;
    this.dialogRef = this.dialog.open(RoleComponent, cfg);
    this.dialogRef.componentInstance.setRole({});
  }

  editRole(id: string) {
    debug('edit Role:', id);
    this.rolesService.get(id, {})
    .then((role) => {
      const cfg: MdDialogConfig = new MdDialogConfig();
      cfg.disableClose = true;
      this.dialogRef = this.dialog.open(RoleComponent, cfg);
      this.dialogRef.componentInstance.setRole(role);
    })
    .catch((err) => {
      console.error('editRole() err:', err);
    });
  }

  deleteRole(id: string, idx: number, role: any) {
    const config: MdDialogConfig = new MdDialogConfig();
    config.data = {
      msg: `Are you sure you want to delete this role - ${role.name}?`
    };
    this.dialog.open(OkCancelDialogComponent, config)
    .afterClosed()
    .subscribe((res) => {
      if (res === 'Ok') {
        debug('delete Role:', id);
        this.rolesService.remove(id);
      }
    });
  }
}
