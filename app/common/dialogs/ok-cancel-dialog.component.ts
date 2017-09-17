import { Component,
         Inject } from '@angular/core';
import { MdDialogRef,
         MD_DIALOG_DATA } from '@angular/material';
const debug = require('debug').debug('partout:component:ok-cancel');

const html = require('./ok-cancel.template.html');
const css = require('./ok-cancel.css');

@Component({
  selector: 'ok-cancel',
  template: html,
  styles: [css]
})

export class OkCancelDialogComponent {
  constructor(
    private dialogRef: MdDialogRef<OkCancelDialogComponent>,
    @Inject(MD_DIALOG_DATA) private data: any
  ) {}
}
