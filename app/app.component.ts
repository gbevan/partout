import { Component, OnInit } from '@angular/core';
import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';
import { RestService, SocketService } from './feathers.service';
import { AgentsService } from './agents.service';
import { CsrsService } from './csrs.service';
import { ViewAgentComponent } from './viewAgent.component';

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
        title: 'ID'
//        action: (id) => { this.viewCsr(id) }
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

  dialogRef: MdDialogRef<ViewAgentComponent>;
  config: MdDialogConfig = {
//    disableClose: false,
//    width: '800px',
//    height: '500px',
//    position: {
//      top: '',
//      bottom: '',
//      left: '',
//      right: ''
//    }
  };

//  public config: any = {
//    className: ['table-striped', 'table-bordered'],
//    paging: true
//  };

//  private subscription: Subscription;
//  private items: any[] = [];

  constructor(
    private restService: RestService,
    private socketService: SocketService,
    private agentsService: AgentsService,
    private csrsService: CsrsService,
    public dialog: MdDialog
  ) {
    console.log('app this:', this);
    setTimeout(function () {
      console.log('restService user:', restService.getUser());
    }, 2000);
  }

  logout() {
    this.restService.logout();
    this.socketService.logout();
  }


  /*****************************
   * CSRs
   */

  refreshAgents() {
    let self = this;
    console.log('app.components.ts: refreshAgents: self:', self);

    this.agentsService.find({
      query: {
        // These arent yet supported by sails-arangodb, nor is pagination
        //$sort: { env: -1 },
        $select: [
          'ip',
          'env',
          'lastSeen',
          'os_family',
          'os_dist_name',
          'os_dist_version_id',
          'os_release',
          'os_hostname',
          'os_arch',
          'platform'
        ]  // works with gbevan/sails-arangodb
      }
    })
    .subscribe(agents => {
      console.log('***** Agents rx subscribe:', agents);
      self.agents = agents.data;
    });
//    .then(function (agents) {
//      self.agents = agents.data;
//      console.log('self.agents:', self.agents);
//    })
//    .catch((err) => {
//      console.error('refreshAgents() err:', err);
//    });

  }

  viewAgent(id) {
    console.log('viewAgent() id:', id);
    console.log('viewAgent() this:', this);

    this.agentsService.get(id, {})
    .then((agent) => {
      console.log('viewAgent() agent:', agent);
      this.dialogRef = this.dialog.open(ViewAgentComponent, this.config)
      this.dialogRef.componentInstance.setAgent(agent);
      console.log('app viewAgent this.dialogRef:', this.dialogRef);
    })
    .catch((err) => {
      console.error('viewAgent() err:', err);
    });
  }

  deleteAgent(id, index) {
    this.agentsService.remove(id, {})
    .then((agent) => {
      console.log('deleteAgent() agent:', agent, 'index:', index);
      //this.agents.splice(index, 1);
    })
    .catch((err) => {
      console.error('deleteAgent() err:', err);
    });
  }


  /*****************************
   * CSRs
   */

  refreshCsrs() {
    let self = this;
    console.log('app.components.ts: refreshAgents: self:', self);

    this.csrsService.find({
      query: {
        // These arent yet supported by sails-arangodb, nor is pagination
        //$sort: { env: -1 },
        $select: [
          'ip',
          'csr',
          'lastSeen',
          'status',
          'cert',
          'cert_pem'
        ]  // works with gbevan/sails-arangodb
      }
    })
    .subscribe(csrs => {
      console.log('***** CSRs rx subscribe:', csrs);
      self.csrs = csrs.data;
    })
//    .then(function (csrs) {
//      self.csrs = csrs.data;
//      console.log('self.csrs:', self.csrs);
//    })
//    .catch((err) => {
//      console.error('refreshCsrs() err:', err);
//    })
    ;
  }

  viewCsr(id) {
    console.log('viewCsr() id:', id);
    console.log('viewCsr() this:', this);
    /*
    this.agentsService.get(id, {})
    .then((agent) => {
      console.log('viewCsr() agent:', agent);
      this.dialogRef = this.dialog.open(ViewAgentComponent, this.config)
      this.dialogRef.componentInstance.setAgent(agent);
      console.log('app viewCsr this.dialogRef:', this.dialogRef);
    })
    .catch((err) => {
      console.error('viewCsr() err:', err);
    });
    */
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
