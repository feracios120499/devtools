import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Meta, Title } from '@angular/platform-browser';

// Import PrimeNG components properly
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';

// Only declare Monaco type for type checking, don't use directly
// It will be accessed dynamically only in browser context
interface Monaco {
  editor: any;
  languages: any;
}

interface SpacingOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MonacoEditorModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    ToastModule,
    TooltipModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './json-formatter.component.html',
  styleUrl: './json-formatter.component.scss'
})
export class JsonFormatterComponent implements OnInit, AfterViewInit, OnDestroy {
  inputCode: string = '';
  outputCode: string = '';
  
  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  
  editorTheme: string = 'vs-dark'; // Default theme
  
  // Spacing options for the dropdown
  spacingOptions: SpacingOption[] = [
    { label: '2 Spaces', value: 2 },
    { label: '4 Spaces', value: 4 }
  ];
  
  // Default spacing selection
  selectedSpacing: SpacingOption = this.spacingOptions[0];
  
  // Для SSR и манипуляций с DOM
  private schemaScriptElement: HTMLElement | null = null;
  
  inputEditorOptions = {
    theme: this.editorTheme,
    language: 'json',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    folding: true,
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    formatOnPaste: true,
    formatOnType: true,
    scrollbar: {
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  };
  
  outputEditorOptions = {
    theme: this.editorTheme,
    language: 'json',
    readOnly: true,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    folding: true,
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    scrollbar: {
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  };
  
  isBrowser: boolean = false;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private metaService: Meta,
    private titleService: Title,
    private messageService: MessageService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // React to theme changes in the application, only in browser
    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }
    
    // Set page title
    this.pageTitleService.setTitle('JSON Formatter and Validator');
  }
  
  ngOnInit() {
    // Start with empty input
    this.inputCode = '';
    
    // SEO setup
    this.setupSeo();
    
    // Добавить JSON-LD в head
    this.addJsonLdToHead();
  }
  
  ngAfterViewInit() {
    // No initialization needed
  }
  
  ngOnDestroy() {
    // Удаляем элемент при уничтожении компонента, только в браузере
    if (this.isBrowser && this.schemaScriptElement) {
      try {
        this.renderer.removeChild(this.document.head, this.schemaScriptElement);
      } catch (e) {
        console.error('Error removing JSON-LD script:', e);
      }
    }
  }
  
  /**
   * Добавляет JSON-LD скрипт в head документа
   */
  private addJsonLdToHead() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "JSON Formatter and Validator",
      "description": "Free online tool for formatting and validating JSON code",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All"
    };
    
    const jsonLdContent = JSON.stringify(schema);
    
    // Добавляем скрипт в head с помощью Renderer2 на сервере и в браузере
    // Renderer2 абстрагирует DOM операции и правильно работает в SSR
    try {
      const scriptElement = this.renderer.createElement('script');
      this.renderer.setAttribute(scriptElement, 'type', 'application/ld+json');
      this.renderer.setProperty(scriptElement, 'textContent', jsonLdContent);
      
      // Добавляем в head
      this.renderer.appendChild(this.document.head, scriptElement);
      
      // Сохраняем ссылку для последующего удаления
      this.schemaScriptElement = scriptElement;
    } catch (e) {
      console.error('Error adding JSON-LD script using Renderer2:', e);
    }
  }
  
  /**
   * Handles spacing option change
   */
  onSpacingChange() {
    // Reformat JSON with the new spacing
    this.formatJson();
  }
  
  /**
   * Copy formatted JSON to clipboard
   */
  copyToClipboard() {
    if (!this.isBrowser || !this.outputCode) return;
    
    navigator.clipboard.writeText(this.outputCode).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: 'JSON copied to clipboard',
        life: 3000
      });
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard',
        life: 3000
      });
    });
  }
  
  /**
   * Download JSON as a file
   */
  downloadJson() {
    if (!this.isBrowser || !this.outputCode) return;
    
    try {
      const blob = new Blob([this.outputCode], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formatted.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: 'JSON file has been downloaded',
        life: 3000
      });
    } catch (error) {
      console.error('Failed to download: ', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download JSON file',
        life: 3000
      });
    }
  }
  
  /**
   * Paste from clipboard
   */
  pasteFromClipboard() {
    if (!this.isBrowser) return;
    
    navigator.clipboard.readText().then((text) => {
      this.inputCode = text;
      this.formatJson();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Pasted!',
        detail: 'Text pasted from clipboard',
        life: 3000
      });
    }).catch((err) => {
      console.error('Error pasting from clipboard: ', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to paste from clipboard',
        life: 3000
      });
    });
  }
  
  /**
   * Load sample JSON data
   */
  loadSampleJson() {
    this.inputCode = `{"example":"data","number":123,"array":[1,2,3]}`;
    this.formatJson();
  }
  
  /**
   * Clear all JSON input
   */
  clearJson() {
    this.inputCode = '';
    this.outputCode = '';
  }
  
  /**
   * Перезагружает страницу
   */
  reloadPage() {
    if (this.isBrowser) {
      window.location.reload();
    }
  }
  
  // Setup metadata for SEO
  private setupSeo() {
    // We don't need to set the title here anymore as it's handled by PageTitleService
    
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Free online JSON formatter and validator tool. Easily clean, format, and validate messy JSON data with customizable indentation options. Convert raw JSON into beautifully formatted and readable structure for better code readability and debugging. Supports copy, paste, and download features.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'JSON formatter, JSON validator, JSON parser, format JSON online, JSON tools' 
    });
    
    // Open Graph meta tags for better social sharing
    this.metaService.updateTag({ property: 'og:title', content: 'JSON Formatter and Validator | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Free online JSON formatter and validator. Convert raw JSON into beautifully formatted, readable structure with customizable indentation. Includes validation, copy, and download options.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
    
    // Note: Schema.org structured data is now added directly in the HTML template
    // This ensures it will be visible to search engine crawlers during server-side rendering
  }
  
  // Update editor settings when theme changes
  updateEditorTheme() {
    this.inputEditorOptions = {
      ...this.inputEditorOptions,
      theme: this.editorTheme
    };
    
    this.outputEditorOptions = {
      ...this.outputEditorOptions,
      theme: this.editorTheme
    };
  }
  
  /**
   * Format a JSON string with proper indentation but keep arrays on one line
   */
  prettyPrintJson(json: string): string {
    try {
      // Parse the JSON to ensure it's valid
      const parsedJson = JSON.parse(json);
      
      // Format with the selected spacing
      const spacingCount = this.selectedSpacing.value;
      
      // Create the spacing string
      const spacer = ' '.repeat(spacingCount);
      
      // Custom replacer function to format JSON
      const formattedJson = JSON.stringify(parsedJson, null, spacer);
      
      // Improved regex to handle arrays of any length and keep them on a single line
      // First collapse simple arrays to single line
      let result = formattedJson;
      
      // This regex pattern finds arrays with items on separate lines and collapses them
      const arrayPattern = new RegExp(`\\[(\\s*\n\\s*[^\\[\\]\\{\\}]+(,\\s*\n\\s*[^\\[\\]\\{\\}]+)*\\s*\n\\s*)\\]`, 'g');
      
      // Process arrays
      result = result.replace(arrayPattern, (match, content) => {
        // Remove newlines and extra spaces between elements
        const singleLine = content
          .replace(/\s*\n\s*/g, ' ')  // Replace newlines and surrounding whitespace with a single space
          .replace(/\s+/g, ' ')       // Normalize spaces
          .replace(/\s*,\s*/g, ', '); // Ensure consistent spacing around commas
        return '[' + singleLine.trim() + ']';
      });
      
      return result;
    } catch (e) {
      // If parsing fails, return the original string
      return json;
    }
  }
  
  /**
   * Format the JSON input
   */
  formatJson() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }
    
    try {
      // First parse to validate JSON
      const parsedJson = JSON.parse(this.inputCode);
      
      // Then format with selected spacing
      this.outputCode = this.prettyPrintJson(this.inputCode);
      
      // Clear any previous error messages
      this.messageService.clear();
    } catch (e) {
      console.error('JSON parsing error:', e);
      
      // Show error in the UI
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid JSON',
        detail: e instanceof Error ? e.message : 'The input is not valid JSON',
        life: 5000
      });
      
      // Still attempt to format what we can for partial errors
      try {
        this.outputCode = this.inputCode;
      } catch (formatError) {
        this.outputCode = 'Error formatting JSON: ' + (formatError instanceof Error ? formatError.message : 'Unknown error');
      }
    }
  }
} 