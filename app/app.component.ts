import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';
import { RestService, SocketService } from './feathers.service';
import { AgentsService } from './agents.service';
import { CsrsService } from './csrs.service';
import { ViewAgentComponent } from './viewAgent.component';
import { ViewCsrComponent } from './viewCsr.component';

// import { AppModule } from './app.module';

// import { Observable } from 'rxjs/Observable';
//import { Subscription } from 'rxjs';

@Component({
  selector: 'my-app',
//  templateUrl: 'app_template',
  templateUrl: 'views/app_template.html',
//  template: '<h1>Hello</h1>',
  styleUrls: ['assets/css/app.component.css']
//  providers: [ AgentsService, SocketService, RestService ]
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
//        innerHtmlFn:
      },
      {
        //field: 'os_family',  // TODO: no field - use whole row  for innerHtmlFn(row)
        title: 'Operating System',
        imgsrc: (row) => {
//          if (value === 'debian') {
//            return 'Debian';
//          }
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
//      {
//        field: 'csr',
//        title: 'CSR'
//      },
      {
        field: 'lastSeen',
        title: 'Last Seen'
      },
      {
        field: 'status',
        title: 'Status'
      },
//      {
//        field: 'cert',
//        title: 'Cert'
//      },
//      {
//        field: 'certPem',
//        title: 'Cert Pem'
//      },
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

//  public config: any = {
//    className: ['table-striped', 'table-bordered'],
//    paging: true
//  };

//  private subscription: Subscription;
//  private items: any[] = [];

  constructor(
    private restService: RestService,
    private socketService: SocketService,
    public agentsService: AgentsService,
    public csrsService: CsrsService,
    public dialog: MdDialog,
    private viewContainerRef: ViewContainerRef
  ) {
    console.log('app this:', this);

    this.config = new MdDialogConfig();
    this.config.viewContainerRef = this.viewContainerRef; // for mdDialog

//    setTimeout(function () {
//      console.log('restService user:', restService.getUser());
//    }, 2000);
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
      console.log('signCsr: csr:', csr);
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
      console.log('rejectCsr: csr:', csr);
      csr.status = 'rejected';
      this.csrsService.update(id, csr);
    })
    .catch((err) => {
      console.error('rejectCsr() err:', err);
    });

  }

//  changeAgentEnv(id) {
//
//  }

}
