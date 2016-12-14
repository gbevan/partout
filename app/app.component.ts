import { Component, OnInit } from '@angular/core';
import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';
import { RestService, SocketService } from './feathers.service';
import { AgentsService } from './agents.service';
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
        field: 'os_family',
        title: 'Operating System'
//        innerHtmlFn:
      },
      {
        field: 'env',
        title: 'Environment'
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
        field: 'csr',
        title: 'CSR'
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
        field: 'cert',
        title: 'Cert'
      },
      {
        field: 'certPem',
        title: 'Cert Pem'
      },
      {
        action: (id, index) => { this.deleteAgent(id, index) },
        value: 'Delete'
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

  refreshAgents() {
    let self = this;
    console.log('app.components.ts: refreshAgents: self:', self);

    this.agentsService.find({
      query: {
        // These arent yet supported by sails-arangodb, nor is pagination
        //$sort: { env: -1 },
        $select: ['ip', 'env', 'lastSeen', 'os_family', 'platform']  // works with gbevan/sails-arangodb
      }
    })
    .then(function (agents) {
      self.agents = agents.data;
      console.log('self.agents:', self.agents);
    })
    .catch((err) => {
      console.error('refreshAgents() err:', err);
    });

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
      this.agents.splice(index, 1);
    })
    .catch((err) => {
      console.error('deleteAgent() err:', err);
    });
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

}
