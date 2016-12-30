import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';
import { RestService, SocketService } from './feathers.service';
import { AgentsService } from './agents.service';
import { CsrsService } from './csrs.service';
import { ViewAgentComponent } from './viewAgent.component';
import { ViewCsrComponent } from './viewCsr.component';

@Component({
  selector: 'my-app',
  templateUrl: 'views/app_template.html',
  styleUrls: ['assets/css/app.component.css']
})
export class AppComponent {

  title = 'Partout with Feathers';

  agents = [];
  agents_config = {
    columns: [
      {
        field: 'id',
        title: 'ID',
        action: (id) => { this.viewAgent(id) }
      },
      {
        field: 'os_hostname',
        title: 'Hostname'
      },
      {
        field: 'ip',
        title: 'IP Address',
        styles: {'font-family': 'monospace'}
      },
      {
        field: 'platform',
        title: 'Platform'
      },
      {
        field: 'os_dist_name',
        title: 'Operating System',
        imgsrc: (row) => {
          if (row.os_dist_name) {

            if (row.os_dist_name.search(/centos/i) !== -1) {
              return '/assets/images/logos/centos.png';

            } else if (row.os_dist_name.search(/gentoo/i) !== -1) {
              return '/assets/images/logos/gentoo.png';

            } else if (row.os_dist_name.search(/oracle/i) !== -1) {
              return '/assets/images/logos/oracle.png';

            } else if (row.os_dist_name.search(/redhat/i) !== -1) {
              return '/assets/images/logos/redhat.png';

            } else if (row.os_dist_name.search(/suse/i) !== -1) {
              return '/assets/images/logos/OpenSUSE.png';

            } else if (row.os_dist_name.search(/ubuntu/i) !== -1) {
              return '/assets/images/logos/ubuntu.png';
            }
          }

          if (row.platform === 'linux') {
            return '/assets/images/logos/Tux.png';

          } else if (row.os_family === 'windows') {
            return '/assets/images/logos/windows.png';
          }
          return '/assets/images/logos/unknown.png';
        },
        styles: {'height': '35px', 'text-align': 'center'}
      },
      {
        field: 'os_dist_version_id',
        title: 'OS Version'
      },
      {
        field: 'os_family',
        title: 'OS Family'
      },
      {
        field: 'os_release',
        title: 'OS Release'
      },
      {
        field: 'os_arch',
        title: 'Arch'
      },
      {
        field: 'env',
        title: 'Environment'
//        action: (id) => { this.changeAgentEnv(id) }
      },
      {
        field: 'lastSeen',
        title: 'Last Seen'
      },
      {
        action: (id, index) => { this.deleteAgent(id, index) },
        value: 'Delete'
      }
    ]
  };

  csrs = [];
  csrs_config = {
    columns: [
      {
        field: 'id',
        title: 'ID',
        action: (id) => { this.viewCsr(id) }
      },
      {
        field: 'ip',
        title: 'IP Address',
        styles: {'font-family': 'monospace'}
      },
      {
        field: 'lastSeen',
        title: 'Last Seen'
      },
      {
        field: 'status',
        title: 'Status'
      },
      {
        action: (id) => { this.signCsr(id) },
        value: 'Sign'
      },
      {
        action: (id) => { this.rejectCsr(id) },
        value: 'Reject'
      }
    ]
  };

  agentDialogRef: MdDialogRef<ViewAgentComponent>;
  csrDialogRef: MdDialogRef<ViewCsrComponent>;
  config: MdDialogConfig;

  constructor(
    private restService: RestService,
    private socketService: SocketService,
    public agentsService: AgentsService,
    public csrsService: CsrsService,
    public dialog: MdDialog,
    private viewContainerRef: ViewContainerRef
  ) {
    this.config = new MdDialogConfig();
    this.config.viewContainerRef = this.viewContainerRef; // for mdDialog
  }

  logout() {
    this.restService.logout();
    this.socketService.logout();
  }


  /*****************************
   * Agents
   */

  viewAgent(id) {
    this.agentsService.get(id, {})
    .then((agent) => {
      this.agentDialogRef = this.dialog.open(ViewAgentComponent, this.config)
      this.agentDialogRef.componentInstance.setAgent(agent);
    })
    .catch((err) => {
      console.error('viewAgent() err:', err);
    });
  }

  deleteAgent(id, index) {
    this.agentsService.remove(id, {})
    .then((agent) => {
      console.log('deleteAgent() agent:', agent, 'index:', index);
    })
    .catch((err) => {
      console.error('deleteAgent() err:', err);
    });
  }


  /*****************************
   * CSRs
   */

  viewCsr(id) {
    this.csrsService.get(id, {})
    .then((csr) => {
      this.csrDialogRef = this.dialog.open(ViewCsrComponent, this.config)
      this.csrDialogRef.componentInstance.setCsr(csr);
    })
    .catch((err) => {
      console.error('viewCsr() err:', err);
    });
  }

  signCsr(id) {
    this.csrsService.get(id, {})
    .then((csr) => {
      csr.status = 'signed';
      this.csrsService.update(id, csr);
    })
    .catch((err) => {
      console.error('signCsr() err:', err);
    });
  }

  rejectCsr(id) {
    this.csrsService.get(id, {})
    .then((csr) => {
      csr.status = 'rejected';
      this.csrsService.update(id, csr);
    })
    .catch((err) => {
      console.error('rejectCsr() err:', err);
    });

  }

}
