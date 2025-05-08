import { Component, OnInit, ViewChild, AfterViewInit, Inject, PLATFORM_ID, effect, NgZone, OnDestroy, Renderer2 } from '@angular/core';
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
import { FloatLabelModule } from 'primeng/floatlabel';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';

// Only declare Monaco type for type checking, don't use directly
// It will be accessed dynamically only in browser context
interface Monaco {
  editor: any;
  languages: any;
}

@Component({
  selector: 'app-json-to-xml',
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
    CardModule,
    FloatLabelModule
  ],
  providers: [MessageService],
  templateUrl: './json-to-xml.component.html',
  styleUrl: './json-to-xml.component.scss'
})
export class JsonToXmlComponent implements OnInit, AfterViewInit, OnDestroy {
  inputCode: string = '';
  outputCode: string = '';
  rootName: string = 'root'; // Добавляем свойство для корневого элемента XML

  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;

  editorTheme: string = 'vs-dark'; // Default theme

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
    language: 'xml',
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
    this.pageTitleService.setTitle('JSON to XML Converter');
  }

  ngOnInit() {
    // Start with empty input
    this.inputCode = '';

    // SEO setup
    this.setupSeo();
  }

  ngAfterViewInit() {
    // No initialization needed
  }

  ngOnDestroy() {
    // Clean up any subscriptions or timers if needed
  }

  /**
   * Copy converted XML to clipboard
   */
  copyToClipboard() {
    if (!this.outputCode) return;

    navigator.clipboard.writeText(this.outputCode).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: 'XML copied to clipboard',
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
   * Download XML as a file
   */
  downloadXml() {
    if (!this.outputCode) return;

    try {
      const blob = new Blob([this.outputCode], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: 'XML file has been downloaded',
        life: 3000
      });
    } catch (error) {
      console.error('Failed to download: ', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download XML file',
        life: 3000
      });
    }
  }

  /**
   * Paste from clipboard
   */
  pasteFromClipboard() {
    navigator.clipboard.readText().then((text) => {
      this.inputCode = text;
      this.convertJsonToXml();

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
    this.inputCode = `{
  "person": {
    "name": "John",
    "age": 30,
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "country": "USA"
    },
    "phones": [
      "555-1234",
      "555-5678"
    ]
  }
}`;
    this.convertJsonToXml();
  }

  /**
   * Clear all input
   */
  clearJson() {
    this.inputCode = '';
    this.outputCode = '';
  }

  private setupSeo() {
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Free JSON to XML converter tool. Convert JSON data to XML format with customizable root element name. Easy to use with copy, paste, and download features.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'JSON to XML converter, XML converter, JSON converter, XML transformation, data conversion' 
    });
    
    // Open Graph meta tags
    this.metaService.updateTag({ property: 'og:title', content: 'JSON to XML Converter | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Convert JSON data to XML format with this free online tool. Features customizable root element and easy download options.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
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

  convertJsonToXml() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }

    try {
      // Parse the JSON
      const jsonData = JSON.parse(this.inputCode);
      
      // Convert to XML
      const xml = this.jsonToXml(jsonData, this.rootName);
      
      // Format XML for readability
      this.outputCode = this.formatXml(xml);
      
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
      
      this.outputCode = 'Error converting JSON to XML. Please check your JSON syntax.';
    }
  }

  private jsonToXml(json: any, rootName: string = 'root'): string {
    const convertElement = (element: any, name: string): string => {
      // Handle null or undefined
      if (element === null || element === undefined) {
        return `<${name} xsi:nil="true"/>`;
      }
      
      // Handle primitive types (string, number, boolean)
      if (typeof element !== 'object') {
        return `<${name}>${this.escapeXml(element.toString())}</${name}>`;
      }
      
      // Handle arrays
      if (Array.isArray(element)) {
        return element.map(item => convertElement(item, name)).join('\n');
      }
      
      // Handle objects
      let result = `<${name}>`;
      for (const key in element) {
        if (Object.prototype.hasOwnProperty.call(element, key)) {
          result += '\n' + convertElement(element[key], key);
        }
      }
      result += `\n</${name}>`;
      return result;
    };
    
    // Escape XML special characters
    return `<?xml version="1.0" encoding="UTF-8"?>\n${convertElement(json, rootName)}`;
  }
  
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private formatXml(xml: string): string {
    let formatted = '';
    let indent = '';
    const tab = '  '; // 2 spaces for indentation
    
    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) {
        // Closing tag
        indent = indent.substring(tab.length);
      }
      
      formatted += indent + '<' + node + '>\n';
      
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?xml')) {
        // Opening tag
        indent += tab;
      }
    });
    
    return formatted.substring(1, formatted.length - 2);
  }
}
