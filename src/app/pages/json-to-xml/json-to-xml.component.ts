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

// Import the AppMonacoEditorModule we created
import { AppMonacoEditorModule } from '../../monaco-editor.module';
import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { MonacoLoaderService } from '../../services/monaco-loader.service';

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
    AppMonacoEditorModule,
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
    private messageService: MessageService,
    private monacoLoaderService: MonacoLoaderService
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
    // Initialize Monaco in browser context
    if (this.isBrowser) {
      console.log('JSON to XML: Initializing Monaco editor');
      
      // Use our service for safe Monaco initialization
      this.monacoLoaderService.whenReady(monaco => {
        console.log('JSON to XML: Monaco editor initialized successfully');
        
        // Можно выполнить дополнительную настройку Monaco здесь
        if (this.inputMonacoEditor && this.inputMonacoEditor._editor) {
          console.log('JSON to XML: Input editor instance available');
        }
        
        if (this.outputMonacoEditor && this.outputMonacoEditor._editor) {
          console.log('JSON to XML: Output editor instance available');
        }
      });
    }
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
    "name": "John Doe",
    "age": 30,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "country": "USA"
    },
    "contacts": [
      {
        "type": "email",
        "value": "john@example.com"
      },
      {
        "type": "phone",
        "value": "+1234567890"
      }
    ]
  }
}`;
    this.convertJsonToXml();
  }

  /**
   * Clear all JSON input
   */
  clearJson() {
    this.inputCode = '';
    this.outputCode = '';
  }

  // Setup metadata for SEO
  private setupSeo() {
    this.metaService.updateTag({
      name: 'description',
      content: 'Free online JSON to XML converter tool. Convert complex JSON data to XML format with proper structure and hierarchical formatting. Easily transform JSON data for compatibility with XML-based systems and applications.'
    });

    this.metaService.updateTag({
      name: 'keywords',
      content: 'JSON to XML, JSON converter, XML converter, JSON to XML online, data format conversion'
    });

    // Open Graph meta tags for better social sharing
    this.metaService.updateTag({ property: 'og:title', content: 'JSON to XML Converter | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Free online tool to convert JSON data to XML format. Transform your JSON structure into valid XML markup with proper nesting and hierarchy.' });
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
    try {
      // Check if input is empty
      if (!this.inputCode.trim()) {
        this.outputCode = '';
        return;
      }

      // Parse the JSON to validate it
      const parsedJson = JSON.parse(this.inputCode);

      // Convert JSON to XML с использованием rootName из свойства
      const xmlString = this.jsonToXml(parsedJson, this.rootName);

      // Format the XML with proper indentation
      this.outputCode = this.formatXml(xmlString);

      // Update the editor model if available
      if (this.outputMonacoEditor && this.outputMonacoEditor._editor) {
        const model = this.outputMonacoEditor._editor.getModel();
        if (model) {
          model.setValue(this.outputCode);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.outputCode = `Error: ${error.message}`;
      } else {
        this.outputCode = 'An unknown error occurred while parsing JSON';
      }
    }
  }

  /**
   * Convert JSON object to XML string
   */
  private jsonToXml(json: any, rootName: string = 'root'): string {
    const convertElement = (element: any, name: string): string => {
      if (element === null || element === undefined) {
        return `<${name}></${name}>`;
      }

      if (typeof element === 'object') {
        // Array
        if (Array.isArray(element)) {
          return element.map(item => convertElement(item, name)).join('');
        }

        // Object
        let xml = `<${name}>`;
        for (const key in element) {
          if (Object.prototype.hasOwnProperty.call(element, key)) {
            xml += convertElement(element[key], key);
          }
        }
        xml += `</${name}>`;
        return xml;
      }

      // Simple value (string, number, boolean)
      return `<${name}>${String(element)}</${name}>`;
    };

    return convertElement(json, rootName);
  }

  /**
   * Format XML with proper indentation
   */
  private formatXml(xml: string): string {
    let formatted = '';
    let indent = '';

    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) {
        // Closing tag
        indent = indent.substring(2);
      }

      formatted += indent + '<' + node + '>\n';

      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) {
        // Opening tag
        indent += '  ';
      }
    });

    return formatted.substring(1, formatted.length - 2);
  }
}
