import { Component, OnInit, ViewChild, AfterViewInit, Inject, PLATFORM_ID, effect, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MessageService } from 'primeng/api';
import { camelCase, snakeCase, pascalCase, kebabCase } from 'change-case';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';

// Интерфейс для опций стилей ключей
interface KeyCaseOption {
  label: string;
  value: string;
  transform: (key: string) => string;
}

@Component({
  selector: 'app-json-to-xml',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule
  ],
  providers: [MessageService],
  templateUrl: './json-to-xml.component.html',
  styleUrl: './json-to-xml.component.scss'
})
export class JsonToXmlComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  inputCode: string = '';
  outputCode: string = '';
  rootName: string = 'root'; // Свойство для корневого элемента XML

  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;

  editorTheme: string = 'vs-dark'; // Default theme

  // Опции для стилей ключей
  keyCaseOptions: KeyCaseOption[] = [
    { label: 'Original', value: 'original', transform: (key) => key },
    { label: 'camelCase', value: 'camelCase', transform: camelCase },
    { label: 'snake_case', value: 'snakeCase', transform: snakeCase },
    { label: 'PascalCase', value: 'pascalCase', transform: pascalCase },
    { label: 'kebab-case', value: 'kebabCase', transform: kebabCase }
  ];

  // Default key case selection
  selectedKeyCase: KeyCaseOption = this.keyCaseOptions[0];

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
    },
    fixedOverflowWidgets: true
  };

  isBrowser: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
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
    // Очистка SEO-элементов
    this.seoService.destroy();
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
    if (!this.isBrowser) return;

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
  "personData": {
    "name": "John",
    "age": 30,
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "country": "USA"
    },
    "phonesArray": [
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

  /**
   * Настройка SEO-метаданных через SeoService
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'JSON to XML Converter | DevTools',
      OgDescription: 'Convert JSON data to XML format with this free online tool. Features customizable root element and easy download options.',
      description: 'Free JSON to XML converter tool. Convert JSON data to XML format with customizable root element name. Easy to use with copy, paste, and download features.',
      keywords: ['JSON to XML converter', 'XML converter', 'JSON converter', 'XML transformation', 'data conversion', 'JSON to XML online', 'convert JSON to XML', 'XML generator', 'json to xml', 'jsontoxml', 'json xml converter', 'json to xml converter', 'json to xml online', 'json to xml online converter', 'json to xml online converter', 'json to xml online converter', 'json to xml online converter'],
      jsonLd: {
        name: 'JSON to XML Converter',
        description: 'Free online tool for converting JSON data to XML format',
        url: 'https://onlinewebdevtools.com/json-to-xml'
      }
    };

    this.seoService.setupSeo(metaData);
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
   * Handle key case option change
   */
  onKeyCaseChange() {
    this.convertJsonToXml();
  }

  /**
   * Transform keys in an object using the provided function
   */
  transformJsonKeys(obj: any, transformFn: (key: string) => string): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transformJsonKeys(item, transformFn));
    }

    const result: Record<string, any> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const transformedKey = transformFn(key);
        result[transformedKey] = this.transformJsonKeys(obj[key], transformFn);
      }
    }

    return result;
  }

  convertJsonToXml() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }

    try {
      // Parse the JSON
      const jsonData = JSON.parse(this.inputCode);

      // Transform keys if needed
      const transformedJson = this.selectedKeyCase.value !== 'original'
        ? this.transformJsonKeys(jsonData, this.selectedKeyCase.transform)
        : jsonData;

      // Convert to XML
      const xml = this.jsonToXml(transformedJson, this.rootName);

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
