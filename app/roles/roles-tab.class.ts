import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';

import { RolesService } from '../services/services.module';
import { RoleComponent } from '../roles/role.component';

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
        action: (id) => { this.deleteRole(id); },
        value: 'Delete'
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
    debug('TODO: add a role');
    const cfg: MdDialogConfig = new MdDialogConfig();
    cfg.disableClose = true;
    this.dialogRef = this.dialog.open(RoleComponent, cfg);
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

  deleteRole(id: string) {
    debug('delete Role:', id);
    this.rolesService.remove(id);
  }
}
