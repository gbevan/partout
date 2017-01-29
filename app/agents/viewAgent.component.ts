import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
//import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as _ from 'lodash';

import { EnvironmentsService } from '../feathers/environments.service';
const html = require('./viewAgent.template.html');

@Component({
  selector: 'view-agent-dialog',
  template: html,
  styles: [`
.viewAgentTable {
  overflow: visible;
}
.viewAgentHeading: {
  padding-left: 5px;
  padding-right: 5px;
}
.viewAgentOuter {
  overflow: scroll;
  height: 500px;
  width: 800px;
}
  `]
})

export class ViewAgentComponent {
  agent = {facts: {}, certInfo: {}};
  envs = [];
  envsHash = {};

  agentFactsKeys = [];
  agentCertKeys = [];

  constructor(
    public dialogRef: MdDialogRef<ViewAgentComponent>,
    public environmentsService: EnvironmentsService
  ) {
  }

  setAgent(agent: any) {
    this.agent = agent;
    _.each(agent.facts, (v, k) => {
      this.agentFactsKeys.push(k);
    });

    _.each(agent.certInfo, (v, k) => {
      this.agentCertKeys.push(k);
    });

    this.environmentsService.find({})
    .then((res) => {
      console.log('viewAgent res:', res);
      this.envs = res.data;

      this.envs.forEach((e) => {
        this.envsHash[e.id] = e;
      });
    });
  }

  getEnv(id) {
    if (this.envsHash[id]) {
      return this.envsHash[id].name;
    }
    return '';
  }
}
