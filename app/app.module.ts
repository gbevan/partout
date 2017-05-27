import { NgModule }             from '@angular/core';
import { MaterialModule }       from '@angular/material';
import { BrowserModule }        from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { RouterModule, Routes } from '@angular/router';
import { FormsModule }          from '@angular/forms';
import { FlexLayoutModule }     from '@angular/flex-layout';

import { NgbModule }            from '@ng-bootstrap/ng-bootstrap';
import { ChartsModule }         from 'ng2-charts/ng2-charts';

import { AppComponent }         from './app.component';
import { LoginFormComponent }   from './login/login-form.component';

import { P2TableComponent }     from './tables/p2table.component';
import { ViewAgentComponent }   from './agents/viewAgent.component';
import { ViewCsrComponent }     from './csrs/viewCsr.component';
import { UserComponent }        from './users/user.component';
import { RoleComponent }        from './roles/role.component';
import { EnvRepoMgmtComponent } from './environments/env-repo-mgmt.component';

import { P2DashboardComponent } from './dashboard/p2dashboard.component';

import { PieChartComponent }    from './charts/piechart.component';

import { ViewLogDialogComponent } from './common/dialogs/view-log-dialog.component';

import { CollapsableViewComponent } from './common/views/collapsable-view.component';

import { DefaultPipe }          from './common/pipes/default.pipe';

import { HasPermissionGuard }   from './common/guards/rbac.guard';

// Feathers Services
import { ServicesModule }       from './services/services.module';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule.forRoot(),
    NgbModule.forRoot(),
    ChartsModule,
    FormsModule,
    FlexLayoutModule,

    ServicesModule
  ],
  declarations: [
    AppComponent,
    P2TableComponent,
    LoginFormComponent,
    ViewAgentComponent,
    ViewCsrComponent,

    ViewLogDialogComponent,
    CollapsableViewComponent,

    P2DashboardComponent,

    PieChartComponent,
    UserComponent,
    RoleComponent,
    EnvRepoMgmtComponent,

    DefaultPipe
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    HasPermissionGuard
//    AgentTabClass
  ],
  entryComponents: [
    ViewAgentComponent,
    ViewCsrComponent,
    UserComponent,
    RoleComponent,
    EnvRepoMgmtComponent,
    ViewLogDialogComponent
  ]
})
export class AppModule { }
