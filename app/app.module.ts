import { NgModule }             from '@angular/core';
import { MaterialModule }       from '@angular/material';
import { BrowserModule }        from '@angular/platform-browser';
import { FormsModule }          from '@angular/forms';

import { Ng2BootstrapModule,
         PaginationModule }     from 'ng2-bootstrap';
import { ChartsModule }         from 'ng2-charts/ng2-charts';

import { AppComponent }         from './app.component';
import { LoginFormComponent }   from './login/login-form.component';

import { P2TableComponent }     from './tables/p2table.component';
import { ViewAgentComponent }   from './agents/viewAgent.component';
import { ViewCsrComponent }     from './csrs/viewCsr.component';
import { UserComponent }        from './users/user.component';
import { RoleComponent }        from './roles/role.component';

import { P2DashboardComponent } from './dashboard/p2dashboard.component';

import { PieChartComponent }    from './charts/piechart.component';

// Feathers Services
import { SocketService }        from './services/feathers.service';
import { AgentsService }        from './services/agents.service';
import { AgentsAllService }     from './services/agents_all.service';
import { CsrsService }          from './services/csrs.service';
import { CsrsAllService }       from './services/csrs_all.service';
import { EnvironmentsService }  from './services/environments.service';
import { UsersService }         from './services/users.service';
import { PermissionsService }   from './services/permissions.service';
import { RolesService }         from './services/roles.service';

@NgModule({
  imports: [
    BrowserModule,
    MaterialModule.forRoot(),
    Ng2BootstrapModule,
    PaginationModule.forRoot(),
//    PrettyJsonModule,
    ChartsModule,
    FormsModule
  ],
  declarations: [
    AppComponent,
    P2TableComponent,
    LoginFormComponent,
    ViewAgentComponent,
    ViewCsrComponent,
    P2DashboardComponent,
    PieChartComponent,
    UserComponent,
    RoleComponent
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    SocketService,
    AgentsService,
    AgentsAllService,
    CsrsService,
    CsrsAllService,
    EnvironmentsService,
    UsersService,
    PermissionsService,
    RolesService
  ],
  entryComponents: [
    ViewAgentComponent,
    ViewCsrComponent,
    UserComponent,
    RoleComponent
  ]
})
export class AppModule { }
