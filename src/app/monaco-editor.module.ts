import { NgModule, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MONACO_BROWSER_CONFIG } from './monaco-config.browser';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule.forRoot() // Use forRoot to configure module
  ],
  exports: [
    MonacoEditorModule
  ],
  providers: []
})
export class AppMonacoEditorModule {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    // Динамически добавляем конфигурацию Monaco Editor только в браузере
    if (isPlatformBrowser(this.platformId)) {
      import('./monaco-config.browser').then(module => {
        // Модуль загружен, но конфигурация будет применена только при
        // первой инициализации Monaco Editor в компоненте
      });
    }
  }
} 