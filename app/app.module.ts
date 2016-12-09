import { NgModule }      from '@angular/core';
import { MaterialModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';

import { Ng2BootstrapModule } from 'ng2-bootstrap/ng2-bootstrap';

//import { PaginationModule } from 'ng2-bootstrap/ng2-bootstrap';
import { PaginationModule } from 'ng2-bootstrap/components/pagination';
//import {Ng2PaginationModule} from 'ng2-pagination';

import { Ng2TableModule } from 'ng2-table/ng2-table';

import { AppComponent }   from './app.component';
import { LoginFormComponent }   from './login-form.component';

import { P2TableComponent }   from './p2table.component';

// Feathers Services
import { RestService, SocketService } from './feathers.service';
import { AgentsService } from './agents.service';

@NgModule({
  imports: [
    BrowserModule,
    MaterialModule.forRoot(),
    Ng2BootstrapModule,
    Ng2TableModule,
    PaginationModule
  ],
  declarations: [ AppComponent/*, P2TableComponent*/, LoginFormComponent ],
  bootstrap:    [ AppComponent/*, P2TableComponent*/ ],
  providers: [ SocketService, RestService, AgentsService ]
})
export class AppModule { }
