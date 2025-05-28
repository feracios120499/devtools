import { NgModule } from '@angular/core';
import { MonacoScrollFixDirective } from '../directives/monaco-scroll-fix.directive';

@NgModule({
  imports: [MonacoScrollFixDirective],
  exports: [MonacoScrollFixDirective]
})
export class MonacoDirectivesModule { } 