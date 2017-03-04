import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';
import { RestService, SocketService } from './feathers/feathers.service';
import { AgentsService } from './feathers/agents.service';
import { CsrsService } from './feathers/csrs.service';
import { EnvironmentsService } from './feathers/environments.service';
import { UsersService } from './feathers/users.service';
import { RolesService } from './feathers/roles.service';
import { ViewAgentComponent } from './agents/viewAgent.component';
import { ViewCsrComponent } from './csrs/viewCsr.component';

const html = require('./app_template.html');

@Component({
  selector: 'my-app',
  template: html,
  styles: [`
.app-top-toolbar {
  -moz-border-radius: 5px;
  border-radius: 5px;
}

.app-toolbar-filler {
  flex: 1 1 auto;
}

.app-toolbar-sep:before {
  content: '|';
  padding-left: 10px;
  padding-right: 10px;
}
`]
})
export class AppComponent {

  title = 'Partout with Feathers';

//  agents = [];
  agents_config = {
    columns: [
      {
        field: 'id',
        title: 'ID',
        styles: {
          'font-size': '80%'
        },
        action: (id) => { this.viewAgent(id); }
      },
      {
        field: 'os_hostname',
        title: 'Hostname',
        styles: {
          'white-space': 'nowrap'
        }
      },
      {
        field: 'ip',
        title: 'IP Address',
        styles: {
          'font-family': 'monospace',
          'font-size': '80%'
        }
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

            // TODO: Pre-load images via webpack if pos.
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
        field: 'environment',
        title: 'Environment',
        styles: (v) => {
          if (!v || v === '') {
            return {
              'background-color': 'red',
//              'content': 'n/a',
              'color': 'white',
              'padding-left': '5px',
              'width': '100%'
            };
          }
        },
        valueFn: (v) => {
          if (!v || v === '') {
            return 'n/a';
          }
          return v.name;
        }
//        action: (id) => { this.changeAgentEnv(id) }
      },
      {
        field: 'lastSeen',
        title: 'Last Seen',
//        styles: {
//          'font-size': '80%',
//          'white-space': 'nowrap'
//        },
        pipe: 'datetime'
      },
      {
        action: (id, index) => { this.deleteAgent(id, index); },
        value: 'Delete'
      }
    ],
    defaultSortBy: 'os_hostname'
    // caseSensitive: true|false
  };

//  csrs = [];
  csrs_config = {
    columns: [
      {
        field: 'id',
        title: 'ID',
        action: (id) => { this.viewCsr(id); },
        styles: {
          'font-size': '80%'
        },
      },
      {
        field: 'ip',
        title: 'IP Address',
        styles: {
          'font-family': 'monospace',
          'font-size': '80%'
        }
      },
      {
        field: 'lastSeen',
        title: 'Last Seen',
        styles: {
          'font-size': '80%',
          'white-space': 'nowrap'
        }
      },
      {
        field: 'status',
        title: 'Status'
      },
      {
        action: (id) => { this.signCsr(id); },
        value: 'Sign'
      },
      {
        action: (id) => { this.rejectCsr(id); },
        value: 'Reject'
      },
      {
        action: (id) => { this.deleteCsr(id); },
        value: 'Delete'
      }
    ],
    defaultSortBy: 'ip'
  };

  environments_config = {
    columns: [
      {
        field: 'name',
        title: 'Name'
      },
      {
        field: 'description',
        title: 'Description'
      },
      {
        action: (id) => { this.deleteEnv(id); },
        value: 'Delete'
      }
    ],
    defaultSortBy: 'name'
  };

  users_config = {
    columns: [
      {
        field: 'username',
        title: 'User Name'
      },
      {
        field: 'name',
        title: 'Full Name'
      },
      {
        action: (id) => { this.editUser(id); },
        value: 'Edit'
      },
      {
        action: (id) => { this.deleteUser(id); },
        value: 'Delete',
        condFn: (id) => {
          const u = this.restService.getUser();
//          console.log((new Error('condFn')).stack);
//          console.log('id:', id, 'u.id:', u.id);
          return u.id !== id; // show if not logged in user
        }
      }
    ],
    defaultSortBy: 'username'
  };

  roles_config = {
    columns: [
      {
        field: 'name',
        title: 'Role Name'
      },
      {
        field: 'description',
        title: 'Description'
      }
    ],
    defaultSortBy: 'name'
  };

  agentDialogRef: MdDialogRef<ViewAgentComponent>;
  csrDialogRef: MdDialogRef<ViewCsrComponent>;
  config: MdDialogConfig;

  constructor(
    private restService: RestService,
    private socketService: SocketService,
    public agentsService: AgentsService,
    public csrsService: CsrsService,
    public environmentsService: EnvironmentsService,
    public usersService: UsersService,
    public rolesService: RolesService,
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
      console.log('agent:', agent);
      this.agentDialogRef = this.dialog.open(ViewAgentComponent, this.config);
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
      this.csrDialogRef = this.dialog.open(ViewCsrComponent, this.config);
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

  deleteCsr(id) {
    this.csrsService.remove(id, {})
    .then((csr) => {
      console.log('deleteCsr() csr:', csr);
    })
    .catch((err) => {
      console.error('deleteCsr() err:', err);
    });
  }

  /*****************************
   * Environments
   */
  deleteEnv(id) {
    this.environmentsService.remove(id, {})
    .then((env) => {
      console.log('deleteEnv() env:', env);
    })
    .catch((err) => {
      console.error('deleteEnv() err:', err);
    });
  }

  /*****************************
   * Users
   */
  addUser() {
    console.log('TODO: add a user');
  }

  editUser(id) {
    console.log('TODO: edit a user, id:', id);
  }

  deleteUser(id) {
    console.log('TODO: delete a user, id:', id);

  }

  /*****************************
   * Roles
   */
  addRole() {
    console.log('TODO: add a role');
  }

}
