import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PartoutMaterialModule } from '../partout-material.module';

import { ToolbarComponent } from './toolbar.component';

@NgModule({
  imports: [
    CommonModule,
    PartoutMaterialModule
  ],
  declarations: [
    ToolbarComponent
  ],
  entryComponents: [

  ],
  exports: [
    ToolbarComponent
  ]
})

export class ToolbarModule { }

export {
  ToolbarComponent
};
