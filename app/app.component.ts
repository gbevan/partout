import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';

import { SocketService,
         AgentsService,
         CsrsService,
         EnvironmentsService,
         UsersService,
         PermissionsService,
         RolesService } from './services/services.module';

import { RoleComponent } from './roles/role.component';

import { HasPermissionGuard }   from './common/guards/rbac.guard';

import { AgentsTabClass } from './agents/agents-tab.class';
import { CsrsTabClass } from './csrs/csrs-tab.class';
import { EnvironmentsTabClass } from './environments/envs-tab.class';
import { UsersTabClass } from './users/users-tab.class';
import { RolesTabClass } from './roles/roles-tab.class';
import { PermissionsTabClass } from './permissions/permissions-tab.class';

const html = require('./app_template.html');

const debug = require('debug').debug('partout:component:app');

@Component({
  selector: 'my-app',
  template: html,
  styles: [`
.app-top-toolbar {
  -moz-border-radius: 5px;
  border-radius: 5px;
}

.app-toolbar-filler {
  flex: 1 1 auto;
}

.app-toolbar-sep:before {
  content: '|';
  padding-left: 10px;
  padding-right: 10px;
}
`]
})
export class AppComponent {
  title = 'Partout with Feathers';

  config: MdDialogConfig;

  private ready: boolean = false;

  private agentsTabClass: AgentsTabClass;
  private csrsTabClass: CsrsTabClass;
  private environmentsTabClass: EnvironmentsTabClass;
  private usersTabClass: UsersTabClass;
  private rolesTabClass: RolesTabClass;
  private permissionsTabClass: PermissionsTabClass;

  constructor(
    private socketService: SocketService,
    private agentsService: AgentsService,
    private csrsService: CsrsService,
    private environmentsService: EnvironmentsService,
    private usersService: UsersService,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
    private dialog: MdDialog,
    private viewContainerRef: ViewContainerRef,
    private hasPermissionGuard: HasPermissionGuard,

  ) {
    this.config = new MdDialogConfig();
    this.config.viewContainerRef = this.viewContainerRef; // for mdDialog

    this.agentsTabClass = new AgentsTabClass(agentsService, dialog);
    this.csrsTabClass = new CsrsTabClass(csrsService, dialog);
    this.environmentsTabClass = new EnvironmentsTabClass(environmentsService, dialog);
    this.usersTabClass = new UsersTabClass(usersService, dialog, socketService);
    this.rolesTabClass = new RolesTabClass(rolesService, dialog);
    this.permissionsTabClass = new PermissionsTabClass(permissionsService, dialog);
  }

  ngOnInit() {
    return this.socketService.init()
    .then(() => {
      this.ready = true;
    });
  }

  logout() {
    this.socketService.logout();
  }

}
