import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
// import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as _ from 'lodash';

import { AgentsService,
         EnvironmentsService } from '../services/services.module';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:viewAgent');

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
  agent = {id: null, facts: {}, certInfo: {}, env: null, environment: {}};
  envs = [];
//  envsHash = {};

  agentFactsKeys = [];
  agentCertKeys = [];

  constructor(
    public dialogRef: MdDialogRef<ViewAgentComponent>,
    public agentsService: AgentsService,
    public environmentsService: EnvironmentsService
  ) {
  }

  setAgent(agent: any) {
    debug('setAgent() agent:', agent);
    this.agent = agent;
    _.each(agent.facts, (v, k) => {
      this.agentFactsKeys.push(k);
    });

    _.each(agent.certInfo, (v, k) => {
      this.agentCertKeys.push(k);
    });

    this.environmentsService.find({query: {$sort: {name: 1}}})
    .then((res) => {
      debug('setAgent() res:', res);
      this.envs = res.data;

//      this.envs.forEach((e) => {
//        this.envsHash[e.id] = e;
//      });
    });
  }

//  getEnv(id) {
//    debug('getEnv for id:', id, 'envsHash:', this.envsHash);
//    if (this.envsHash[id]) {
//      return this.envsHash[id].name;
//    }
//    return '';
//  }

  envSelected() {
    debug('envSelected() environment:', this.agent.environment);
    this.agentsService.patch(this.agent.id, {environment: this.agent.environment})
    .then((res) => {
      debug('agent patched, res:', res);
      this.agent = res;
    })
    .catch((err) => {
      console.error(err);
    });
  }
}
