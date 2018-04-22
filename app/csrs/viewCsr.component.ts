import { Component, Input } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'view-csr-dialog',
  template: `

<h1>View CSR Detail:</h1>
<div class="viewOuter">
  <table class="table viewTable">
    <tr>
      <th class="viewHeading">Attribute</th>
      <th class="viewHeading">value</th>
    </tr>
    <tr><td>Id</td><td>{{ csr.id }}</td></tr>
    <tr><td>IP Address</td><td>{{ csr.ip }}</td></tr>
    <tr><td>Last Seen</td><td>{{ csr.lastSeen }}</td></tr>
    <tr><td>Status</td><td>{{ csr.status }}</td></tr>
    <tr><td>Cert Pem</td><td><pre>{{ csr.certPem }}</pre></td></tr>

  </table>
</div>

  `,
  styles: [`
.viewTable {
  overflow: visible;
}
.viewHeading: {
  padding-left: 5px;
  padding-right: 5px;
}
.viewOuter {
  overflow: scroll;
  height: 500px;
  width: 800px;
  z-index: 1000000 !important;
}
  `]
})

export class ViewCsrComponent {
  csr = {};

  constructor(public dialogRef: MdDialogRef<ViewCsrComponent>) {
  }

  setCsr(csr: any) {
    this.csr = csr;
  }
}
