import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';

import { PermissionsService } from '../services/services.module';

const debug = require('debug').debug('partout:component:permissions:tabclass');

/*
 * Define Environments main table view and actions
 */
export class PermissionsTabClass {

  private config: any = {
    columns: [
      {
        field: 'type',
        title: 'Resource Type'
      },
      {
        field: 'subtype',
        title: 'Resource SubType'
      },
      {
        field: 'name',
        title: 'Resource Name'
      },
      {
        field: 'description',
        title: 'Description'
      },
      {
        field: 'access',
        title: 'Access'
//      },
//      {
//        action: (id) => { this.editPermission(id); },
//        value: 'Edit'
//      },
//      {
//        action: (id) => { this.deletePermission(id); },
//        value: 'Delete'
      }
    ],
    defaultSortBy: 'description'
  };

//  private dialogRef: MdDialogRef<PermissionsComponent>;

  constructor(
    private permissionsService: PermissionsService,
    private dialog: MdDialog,
//    private socketService: SocketService
  ) {}

  getConfig() {
    return this.config;
  }

}
