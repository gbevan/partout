import { NgModule }               from '@angular/core';
import { CommonModule }           from '@angular/common';

import { SocketService }          from './feathers.service';
import { AgentsService }          from './agents.service';
import { AgentsAllService }       from './agents_all.service';
import { CsrsService }            from './csrs.service';
import { CsrsAllService }         from './csrs_all.service';
import { EnvironmentsService }    from './environments.service';
import { UsersService }           from './users.service';
import { PermissionsService }     from './permissions.service';
import { PermissionsAllService }  from './permissions_all.service';
import { RolesService }           from './roles.service';
import { RolesAllService }        from './roles_all.service';

const SERVICES = [
  SocketService,
  AgentsService,
  AgentsAllService,
  CsrsService,
  CsrsAllService,
  EnvironmentsService,
  UsersService,
  PermissionsService,
  PermissionsAllService,
  RolesService,
  RolesAllService
];

@NgModule({
  imports:    [ CommonModule ],
  providers:  SERVICES
//  exports:    SERVICES
})

export class ServicesModule { }

export {
  SocketService,
  AgentsService,
  AgentsAllService,
  CsrsService,
  CsrsAllService,
  EnvironmentsService,
  UsersService,
  PermissionsService,
  PermissionsAllService,
  RolesService,
  RolesAllService
};
