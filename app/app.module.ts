import { NgModule }      from '@angular/core';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';

import { Ng2BootstrapModule } from 'ng2-bootstrap/ng2-bootstrap';
//import { PaginationModule } from 'ng2-bootstrap/ng2-bootstrap';
import { PaginationModule } from 'ng2-bootstrap/components/pagination';
//import { PaginationModule } from 'ng2-bootstrap';
import { PrettyJsonModule } from 'angular2-prettyjson';
import { ChartsModule } from 'ng2-charts/ng2-charts';

import { AppComponent }   from './app.component';
import { LoginFormComponent }   from './login-form.component';

import { P2TableComponent }   from './p2table.component';
import { ViewAgentComponent }   from './viewAgent.component';
import { ViewCsrComponent }   from './viewCsr.component';

import { P2DashboardComponent }   from './dashboard/p2dashboard.component';

import { PieChartComponent }   from './charts/piechart.component';

// Feathers Services
import { RestService, SocketService } from './feathers.service';
import { AgentsService } from './agents.service';
import { AgentsAllService } from './agents_all.service';
import { CsrsService } from './csrs.service';
import { CsrsAllService } from './csrs_all.service';

@NgModule({
  imports: [
    BrowserModule,
    MaterialModule.forRoot(),
    Ng2BootstrapModule,
    PaginationModule,
    PrettyJsonModule,
    ChartsModule
  ],
  declarations: [
    AppComponent,
    P2TableComponent,
    LoginFormComponent,
    ViewAgentComponent,
    ViewCsrComponent,
    P2DashboardComponent,
    PieChartComponent
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    SocketService,
    RestService,
    AgentsService,
    AgentsAllService,
    CsrsService,
    CsrsAllService
  ],
  entryComponents: [
    ViewAgentComponent,
    ViewCsrComponent
  ]
})
export class AppModule { }
