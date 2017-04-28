import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import * as _ from 'lodash';

import { RolesService,
         PermissionsAllService} from '../services/services.module';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:component:role');

const html = require('./role.template.html');

@Component({
  selector: 'role-dialog',
  template: html,
  styles: [`
.errmsg {
  color: red;
  font-weight: bold;
  text-align: center;
}

.permissions th {
  border-bottom: 1px solid #a2a2a2;
  margin-right: 2px;
  padding: 3px;
}

.permissions td {
  border-left: 1px solid #a2a2a2;
  border-right: 1px solid #a2a2a2;
  margin-top: 2px;
  padding: 3px;
}

.permissions md-select {
  /*width: 500px;*/
}

.list
  overflow-y: scroll;
}
  `]
})

export class RoleComponent {
  private role: any = {};
  private permissionTypes: string[] = [];
  private permissionSubtypesByType: any = {};
  private permissionNamesByTypeSubType: any = {};
  private permissionAccessByTypeSubTypeName: any = {};
  private errmsg: string = '';

  constructor(
    private dialogRef: MdDialogRef<RoleComponent>,
    private rolesService: RolesService,
    private permissionsAllService: PermissionsAllService
  ) { }

  getPermissionTypes() {
    debug('getPermissionTypes()');
    this.permissionTypes = [];
    this.permissionSubtypesByType = {};
    this.permissionNamesByTypeSubType = {};
    this.permissionAccessByTypeSubTypeName = {};

    this.permissionsAllService.find()
    .then((p_res) => {
      debug('p_res:', p_res);
      this.permissionTypes = _.uniq(p_res.map((o) => o.type)) as string[];

      const seenSubType = {};
      const seenName = {};
      const seenAccess = {};
      p_res.forEach((p) => {
        const subTypeKey = p.type,
              nameKey = p.type + ':' + p.subtype,
              accessKey = p.type + ':' + p.subtype + ':' + p.name;

        if (!seenSubType[subTypeKey]) {
          seenSubType[subTypeKey] = {};
        }

        if (!seenName[p.type + ':' + p.subtype]) {
          seenName[p.type + ':' + p.subtype] = {};
        }

        if (!seenAccess[p.type + ':' + p.subtype + ':' + p.name]) {
          seenAccess[p.type + ':' + p.subtype + ':' + p.name] = {};
        }

        // collect uniq subtypes for each type
        if (!this.permissionSubtypesByType[subTypeKey]) {
          this.permissionSubtypesByType[subTypeKey] = [];
        }
        if (!seenSubType[subTypeKey][p.subtype]) {
          this.permissionSubtypesByType[subTypeKey].push(p.subtype);
          seenSubType[subTypeKey][p.subtype] = true;
        }

        // collect uniq names for each type:subtype
        if (!this.permissionNamesByTypeSubType[nameKey]) {
          this.permissionNamesByTypeSubType[nameKey] = [];
        }
        if (!seenName[nameKey][p.name]) {
          debug('pushing to', nameKey, 'name', p.name);
          this.permissionNamesByTypeSubType[nameKey].push(p.name);
          seenName[nameKey][p.name] = true;
        }

        // collect uniq access types for each type:subtype:name
        if (!this.permissionAccessByTypeSubTypeName[accessKey]) {
          this.permissionAccessByTypeSubTypeName[accessKey] = [];
        }
        if (!seenAccess[accessKey][p.access]) {
          debug('pushing to', accessKey, 'access:', p.access);
          this.permissionAccessByTypeSubTypeName[accessKey].push(p.access);
          seenAccess[accessKey][p.access] = true;
        }

      });
      debug('permissionSubtypesByType:', this.permissionSubtypesByType);
      debug('permissionNamesByTypeSubType:', this.permissionNamesByTypeSubType);
      debug('permissionAccessByTypeSubTypeName:', this.permissionAccessByTypeSubTypeName);
    })
    .catch((err) => {
      console.error(err);
    });
  }

  setRole(role) {
    debug('setRole() role:', role);
    this.role = role;
    this.getPermissionTypes();
  }

  addPermission() {
    if (!this.role.permissions) {
      this.role.permissions = [];
    }
    this.role.permissions.push({});
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

  deletePermission(i) {
    this.role.permissions.splice(i, 1);
  }
}
