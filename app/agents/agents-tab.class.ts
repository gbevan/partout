import { MdDialog,
         MdDialogRef,
         MdDialogConfig } from '@angular/material';

import { AgentsService } from '../services/services.module';
import { ViewAgentComponent } from './viewAgent.component';

import { OkCancelDialogComponent } from '../common/dialogs/ok-cancel-dialog.component';

/*
 * Define Agents main table view and actions
 */
export class AgentsTabClass {

  private config: any = {
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

            } else if (row.os_dist_name.search(/raspbian/i) !== -1) {
              return '/assets/images/logos/raspbian.png';
            }
          }

          if (row.platform === 'linux') {
            return '/assets/images/logos/Tux.png';

          } else if (row.os_family === 'windows') {
            return '/assets/images/logos/windows.png';
          }
          return '/assets/images/logos/unknown.png';
        },
        styles: {'height': '35px', 'text-align': 'center', 'margin': 'auto', 'display': 'table'}
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
//        field: 'environment',
        field: 'environment.name',
        select: 'environment',
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
        }
//        valueFn: (v) => {
//          if (!v || v === '') {
//            return 'n/a';
//          }
//          return v.name;
//        }
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
        action: (id, index, agent) => { this.deleteAgent(id, index, agent); },
        value: 'Delete',
        color: 'warn'
      }
    ],
    defaultSortBy: 'os_hostname'
    // caseSensitive: true|false
  };

  private dialogRef: MdDialogRef<ViewAgentComponent>;

  constructor(
    private agentsService: AgentsService,
    private dialog: MdDialog
  ) {}

  getConfig() {
    return this.config;
  }

  viewAgent(id) {
    this.agentsService.get(id, {})
    .then((agent) => {
      console.log('agent:', agent);
      const dlgCfg: MdDialogConfig = new MdDialogConfig();
//      dlgCfg.width = '80%';
//      dlgCfg.height = '80%';
      this.dialogRef = this.dialog.open(ViewAgentComponent, dlgCfg);
      this.dialogRef.componentInstance.setAgent(agent);
    })
    .catch((err) => {
      console.error('viewAgent() err:', err);
    });
  }

  deleteAgent(id: string, index: number, agent: any) {
    const config: MdDialogConfig = new MdDialogConfig();
    config.data = {
      msg: `Are you sure you want to delete this agent - ${agent.os_hostname}?`
    };
    this.dialog.open(OkCancelDialogComponent, config)
    .afterClosed()
    .subscribe((res) => {
      if (res === 'Ok') {
        this.agentsService.remove(id, {})
        .then((deletedagent) => {
          console.log('deleteAgent() agent:', deletedagent, 'index:', index);
        })
        .catch((err) => {
          console.error('deleteAgent() err:', err);
        });
      }
    });
  }
}
