import { MdDialog, MdDialogRef, MdDialogConfig } from '@angular/material';

import { CsrsService } from '../services/services.module';
import { ViewCsrComponent } from '../csrs/viewCsr.component';

/*
 * Define Csrs main table view and actions
 */
export class CsrsTabClass {

  private config: any = {
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
        value: 'Reject',
        color: 'warn'
      },
      {
        action: (id) => { this.deleteCsr(id); },
        value: 'Delete',
        color: 'warn'
      }
    ],
    defaultSortBy: 'ip'
  };

  private dialogRef: MdDialogRef<ViewCsrComponent>;

  constructor(
    private csrsService: CsrsService,
    private dialog: MdDialog
  ) {}

  getConfig() {
    return this.config;
  }

  viewCsr(id) {
    this.csrsService.get(id, {})
    .then((csr) => {
      this.dialogRef = this.dialog.open(ViewCsrComponent, this.config);
      this.dialogRef.componentInstance.setCsr(csr);
    })
    .catch((err) => {
      console.error('viewCsr() err:', err);
    });
  }

  signCsr(id) {
    this.csrsService.get(id, {})
    .then((csr) => {
//      csr.status = 'signed';
//      this.csrsService.update(id, csr);
      this.csrsService.patch(id, {
        status: 'signed',
        certPem: csr.certPem,
        csr: csr.csr
      });
    })
    .catch((err) => {
      console.error('signCsr() err:', err);
    });
  }

  rejectCsr(id) {
    this.csrsService.get(id, {})
    .then((csr) => {
//      csr.status = 'rejected';
//      this.csrsService.update(id, csr);
      this.csrsService.patch(id, {status: 'rejected'});
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

}
