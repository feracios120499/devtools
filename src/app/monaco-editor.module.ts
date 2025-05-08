import { NgModule, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule.forRoot({
      baseUrl: 'assets/monaco', // Ensure correct base path
      defaultOptions: { scrollBeyondLastLine: false } // Default editor options
    })
  ],
  exports: [
    MonacoEditorModule
  ]
})
export class AppMonacoEditorModule {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Make sure Monaco's initialization scripts only run in browser
    if (isPlatformBrowser(this.platformId)) {
      // This will be populated by forRoot configuration
    }
  }
} 