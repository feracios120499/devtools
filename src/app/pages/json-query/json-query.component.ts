import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { FavoritePageDirective } from '../../directives/favorite-page.directive';

// Only declare Monaco type for type checking, don't use directly
// It will be accessed dynamically only in browser context
interface Monaco {
  editor: any;
  languages: any;
}

@Component({
  selector: 'app-json-query',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MonacoEditorModule,
    PrimeNgModule,
    FavoritePageDirective
  ],
  providers: [MessageService],
  templateUrl: './json-query.component.html',
  styleUrl: './json-query.component.scss'
})
export class JsonQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  // Input data
  inputJson: string = '';
  queryString: string = '';
  queryResult: string = '';
  
  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  
  editorTheme: string = 'vs-dark'; // Default theme
  
  // Error handling
  error: string | null = null;
  
  // For SSR and DOM manipulations
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
    },
    fixedOverflowWidgets: true
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
    },
    fixedOverflowWidgets: true
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
    this.pageTitleService.setTitle('JSON Query Explorer');
  }
  
  ngOnInit() {
    // Start with empty input
    this.inputJson = '';
    this.queryString = 'data';
    
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
      "name": "JSON Query Explorer",
      "description": "Free online tool for querying JSON data with JavaScript expressions",
      "applicationCategory": "Utilities",
      "operatingSystem": "All",
      "url": "https://onlinewebdevtools.com/json-query"
    };
    
    const jsonLdContent = JSON.stringify(schema);
    
    try {
      const scriptElement = this.renderer.createElement('script');
      this.renderer.setAttribute(scriptElement, 'type', 'application/ld+json');
      this.renderer.setProperty(scriptElement, 'textContent', jsonLdContent);
      
      // Add to head
      this.renderer.appendChild(this.document.head, scriptElement);
      
      // Save reference for later removal
      this.schemaScriptElement = scriptElement;
    } catch (e) {
      console.error('Error adding JSON-LD script:', e);
    }
  }
  
  /**
   * Настройка SEO для страницы
   */
  private setupSeo() {
    this.titleService.setTitle('JSON Query Explorer | DevTools');
    
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Free online JSON Query Explorer tool. Query and extract data from JSON using JavaScript expressions. No installation required. Intuitive interface for developers.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'json query, json explorer, query json, javascript json query, json path, json query tool, extract json data, json search, json filter, json javascript' 
    });
    
    // Open Graph meta tags for better social sharing
    this.metaService.updateTag({ property: 'og:title', content: 'JSON Query Explorer | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Free online JSON Query Explorer tool. Query and extract data from JSON using JavaScript expressions.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
  }
  
  /**
   * Update Monaco editor theme dynamically
   */
  updateEditorTheme() {
    if (this.isBrowser) {
      this.ngZone.runOutsideAngular(() => {
        if (this.inputMonacoEditor?.editor) {
          this.inputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
        }
        if (this.outputMonacoEditor?.editor) {
          this.outputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
        }
      });
      
      // Update editor options objects to reflect current theme
      this.inputEditorOptions = {
        ...this.inputEditorOptions,
        theme: this.editorTheme
      };
      
      this.outputEditorOptions = {
        ...this.outputEditorOptions,
        theme: this.editorTheme
      };
    }
  }
  
  /**
   * Copy result to clipboard
   */
  copyToClipboard() {
    if (this.isBrowser && this.queryResult) {
      navigator.clipboard.writeText(this.queryResult)
        .then(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Copied!',
            detail: 'Result copied to clipboard'
          });
        })
        .catch((err: Error) => {
          console.error('Error copying to clipboard:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to copy to clipboard'
          });
        });
    }
  }
  
  /**
   * Download query result as JSON file
   */
  downloadResult() {
    if (this.isBrowser && this.queryResult) {
      try {
        const blob = new Blob([this.queryResult], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = this.renderer.createElement('a');
        a.href = url;
        a.download = 'query-result.json';
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Result downloaded successfully'
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error downloading file:', errorMessage);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to download result'
        });
      }
    }
  }
  
  /**
   * Paste from clipboard to JSON input
   */
  pasteFromClipboard() {
    if (this.isBrowser) {
      navigator.clipboard.readText()
        .then(text => {
          this.inputJson = text;
          this.executeQuery(); // Try to execute query immediately
        })
        .catch((err: Error) => {
          console.error('Failed to read clipboard contents:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to paste from clipboard. Please check permissions.'
          });
        });
    }
  }
  
  /**
   * Load sample JSON for demonstration
   */
  loadSampleJson() {
    const sampleJson = {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "active": true,
      "premium": false,
      "roles": ["user", "editor"],
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "country": "USA",
        "zip": "10001"
      },
      "orders": [
        {
          "id": 101,
          "product": "Laptop",
          "price": 1299.99,
          "date": "2023-01-15"
        },
        {
          "id": 102,
          "product": "Smartphone",
          "price": 899.99,
          "date": "2023-03-20"
        }
      ],
      "metadata": {
        "lastLogin": "2023-04-05T10:30:00",
        "settings": {
          "notifications": true,
          "theme": "dark"
        }
      }
    };
    
    this.inputJson = JSON.stringify(sampleJson, null, 2);
    
    // Load sample query
    this.queryString = 'data.orders.filter(order => order.price > 1000).map(order => ({ id: order.id, product: order.product }))';
    
    // Execute query with sample data
    this.executeQuery();
  }
  
  /**
   * Clear JSON data
   */
  clearJson() {
    this.inputJson = '';
    this.queryResult = '';
    this.error = null;
    
    // Reset query to default
    this.queryString = 'data';
  }
  
  /**
   * Format the input JSON for readability
   */
  formatJson() {
    if (!this.inputJson.trim()) {
      this.queryResult = '';
      this.error = null;
      return;
    }
    
    try {
      const parsedJson = JSON.parse(this.inputJson);
      this.inputJson = JSON.stringify(parsedJson, null, 2);
      this.error = null;
      this.executeQuery();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.error = `Invalid JSON: ${errorMessage}`;
      this.queryResult = '';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Invalid JSON: ${errorMessage}`
      });
    }
  }
  
  /**
   * Execute the query against the input JSON
   */
  executeQuery() {
    this.error = null;
    this.queryResult = '';
    
    if (!this.inputJson.trim()) {
      return;
    }
    
    try {
      // Parse the JSON data
      const data = JSON.parse(this.inputJson);
      
      // Check if query is empty or just 'data'
      if (!this.queryString.trim() || this.queryString.trim() === 'data') {
        this.queryResult = JSON.stringify(data, null, 2);
        return;
      }
      
      // Execute the query expression
      const result = this.evaluateQuery(data);
      
      // Format the result as JSON
      this.queryResult = JSON.stringify(result, null, 2);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.error = `Error executing query: ${errorMessage}`;
    //   this.messageService.add({
    //     severity: 'error',
    //     summary: 'Error',
    //     detail: `Error executing query: ${errorMessage}`
    //   });
    }
  }
  
  /**
   * Evaluate the query expression with the provided data
   */
  private evaluateQuery(data: any): any {
    // Use Function constructor to create a function that evaluates the query
    // This is safer than eval() but still requires careful validation
    try {
      const queryFunction = new Function('data', `
        try {
          return ${this.queryString};
        } catch (e) {
          throw new Error(e.message);
        }
      `);
      
      return queryFunction(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid query: ${errorMessage}`);
    }
  }
} 