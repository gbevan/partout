import { Component, OnInit } from '@angular/core';

import { RestService, SocketService } from './feathers.service';
import { AgentsService } from './agents.service';
import { AppModule } from './app.module';


@Component({
  selector: 'my-app',
  template: `
    <h1>{{ title }} Hello Angular!</h1>
    <h2>service</h2>
    <li *ngFor="let agent of agents">
      {{ agent.ip }}
    </li>
  `,
  providers: [ AgentsService, SocketService, RestService ]
})
export class AppComponent {
  title = 'Partout with Feathers';
  agents = [];

  constructor(private agentsService: AgentsService) {}

  ngOnInit(): void {
    let self = this;

    console.log('AppComponent this:', this);
    console.log('AppModule:', AppModule);

//    this.agentsService.find({query: {}})
//    .then(function (agents) {
//      console.log('agents:', agents);
//      self.agents = agents.data;
//    });
  }
}


