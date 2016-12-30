import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import * as _ from 'lodash';

@Component({
  selector: 'view-agent-dialog',
  template: `

<h1>View Agent Detail:</h1>
<div class="viewAgentOuter">
  <table class="table viewAgentTable">
    <tr>
      <th class="viewAgentHeading">Attribute</th>
      <th class="viewAgentHeading">value</th>
    </tr>
    <tr><td>Id</td><td>{{ agent.id }}</td></tr>
    <tr><td>IP Address</td><td>{{ agent.ip }}</td></tr>
    <tr><td>Environment</td><td>{{ agent.env }}</td></tr>
    <tr><td>Last Seen</td><td>{{ agent.lastSeen }}</td></tr>

    <tr><td colspan="2"><b>Facts:</b></td></tr>
    <tr *ngFor="let k of agentFactsKeys">
      <td>
        {{ k }}
      </td>
      <td>
        <pre>{{ agent.facts[k] | json }}</pre>
      </td>
    </tr>

    <tr><td colspan="2"><b>Agent Certificate:</b></td></tr>
    <tr *ngFor="let k of agentCertKeys">
      <td>
        {{ k }}
      </td>
      <td>
        <pre>{{ agent.certInfo[k] | json }}</pre>
      </td>
    </tr>
  </table>
</div>

  `,
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
  agentFactsKeys = [];
  agentCertKeys = [];

  constructor(public dialogRef: MdDialogRef<ViewAgentComponent>) {
  }

  setAgent(agent:any) {
    this.agent = agent;
    _.each(agent.facts, (v, k) => {
      this.agentFactsKeys.push(k);
    });

    _.each(agent.certInfo, (v, k) => {
      this.agentCertKeys.push(k);
    });
  }
}
