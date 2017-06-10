import { NgModule } from '@angular/core';
import { MdButtonModule,
         MdCheckboxModule,
         MdChipsModule,
         MdDialogModule,
         MdGridListModule,
         MdInputModule,
         MdMenuModule,
         MdSelectModule,
         MdSliderModule,
         MdTabsModule,
         MdToolbarModule } from '@angular/material';

const LIST = [
  MdButtonModule,
  MdCheckboxModule,
  MdChipsModule,
  MdDialogModule,
  MdGridListModule,
  MdInputModule,
  MdMenuModule,
  MdSelectModule,
  MdSliderModule,
  MdTabsModule,
  MdToolbarModule
];

@NgModule({
  imports: LIST,
  declarations: [
  ],
  exports: LIST
})

export class PartoutMaterialModule { }
