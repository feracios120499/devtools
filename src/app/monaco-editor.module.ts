import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule.forRoot()
  ],
  exports: [
    MonacoEditorModule
  ]
})
export class AppMonacoEditorModule {} 