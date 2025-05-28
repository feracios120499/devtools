import { Injectable } from '@angular/core';

export interface MonacoScrollFixOptions {
  mouseWheelScrollSensitivity: number;
  mouseWheelZoom: boolean;
  scrollbar: {
    useShadows: boolean;
    verticalHasArrows: boolean;
    horizontalHasArrows: boolean;
    vertical: string;
    horizontal: string;
    verticalScrollbarSize: number;
    horizontalScrollbarSize: number;
    alwaysConsumeMouseWheel: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MonacoConfigService {

  /**
   * Get default scroll fix options for Monaco Editor
   */
  getScrollFixOptions(): MonacoScrollFixOptions {
    return {
      mouseWheelScrollSensitivity: 0.5,
      mouseWheelZoom: false,
      scrollbar: {
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        alwaysConsumeMouseWheel: false
      }
    };
  }

  /**
   * Merge scroll fix options with existing editor options
   */
  mergeWithScrollFix(existingOptions: any): any {
    const scrollFixOptions = this.getScrollFixOptions();
    
    return {
      ...existingOptions,
      ...scrollFixOptions,
      scrollbar: {
        ...existingOptions.scrollbar,
        ...scrollFixOptions.scrollbar
      }
    };
  }

  /**
   * Get base editor options with common settings and scroll fix
   */
  getBaseEditorOptions(theme: string = 'vs-dark', language: string = 'json'): any {
    return {
      theme,
      language,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      folding: true,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      formatOnPaste: true,
      formatOnType: true,
      fixedOverflowWidgets: true,
      ...this.getScrollFixOptions()
    };
  }

  /**
   * Get read-only editor options with scroll fix
   */
  getReadOnlyEditorOptions(theme: string = 'vs-dark', language: string = 'json'): any {
    return {
      ...this.getBaseEditorOptions(theme, language),
      readOnly: true,
      formatOnPaste: false,
      formatOnType: false
    };
  }
} 