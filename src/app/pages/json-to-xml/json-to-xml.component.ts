import { Component, OnInit, ViewChild, AfterViewInit, Inject, PLATFORM_ID, effect, OnDestroy, HostBinding, ElementRef, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { MessageService } from 'primeng/api';
import { camelCase, snakeCase, pascalCase, kebabCase } from 'change-case';
import { Router, ActivatedRoute, Navigation, RouterModule } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

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
    FormsModule,
    MonacoEditorLazyComponent,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule,
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
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;

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

  // Свойства для полноэкранного режима
  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;
  isFullscreenMode: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private monacoConfigService: MonacoConfigService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Initialize editor options
    this.initializeEditorOptions();

    // React to theme changes in the application, only in browser
    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }

    // Set page title
    this.pageTitleService.setTitle('JSON to XML Converter');

    // Получаем данные из истории (history state)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.inputCode = navigation.extras.state['data'] || '';
      console.log('Data from navigation:', this.inputCode);
    }
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Альтернативный метод получения данных через history state
      const state = history.state;
      if (state?.data) {
        this.inputCode = state.data;
        console.log('Data from history state:', this.inputCode);
        this.convertJsonToXml();
      }
    }

    // Раскомментируйте если предпочитаете использовать подписку на параметры
    // this.route.paramMap.subscribe(() => {
    //   const state = window.history.state;
    //   if (state?.data) {
    //     this.inputCode = state.data;
    //     console.log('Data from subscription:', this.inputCode);
    //     this.convertJsonToXml();
    //   }
    // });

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
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/json-to-xml';
    const shortDescription = 'Convert JSON to XML online for free. Client-side JSON to XML converter with a customizable root element, key-case transformation, syntax-highlighted editors, copy, and download. No signup required.';

    const metaData: MetaData = {
      OgTitle: 'JSON to XML Converter Online | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'JSON to XML converter',
        'convert JSON to XML',
        'JSON to XML online',
        'JSON to XML tool',
        'online JSON to XML',
        'JSON XML converter',
        'JSON to XML transformation',
        'XML generator from JSON',
        'JSON to XML formatter',
        'JSON to XML with root element',
        'free JSON to XML converter',
        'jsontoxml'
      ],
      jsonLd: {
        name: 'JSON to XML Converter Online | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Convert JSON to well-formed XML in the browser',
          'Customizable XML root element name',
          'Key case transformation (camelCase, snake_case, PascalCase, kebab-case)',
          'Pretty-printed indentation for readable XML output',
          'Syntax-highlighted Monaco editors for JSON and XML',
          'Copy to clipboard and download as .xml',
          'Client-side processing for privacy (no data upload)'
        ]
      },
      faq: [
        {
          question: 'Is this JSON to XML converter free to use?',
          answer: 'Yes, it is completely free with no registration, ads, or usage limits.'
        },
        {
          question: 'Do you store my JSON or XML data?',
          answer: 'No. All conversion happens locally in your browser, so your data never touches our servers.'
        },
        {
          question: 'Can I customize the XML root element name?',
          answer: 'Yes. Use the Root name field above the output editor to set any valid XML root element name.'
        },
        {
          question: 'How are JSON arrays converted to XML?',
          answer: 'Each item in a JSON array becomes a repeated sibling XML element that shares the same tag name, which is the standard way to represent collections in XML.'
        },
        {
          question: 'How are null values handled?',
          answer: 'JSON null values are emitted as self-closing XML elements with the xsi:nil="true" attribute.'
        },
        {
          question: 'Can I transform key names while converting?',
          answer: 'Yes. Use the key case dropdown to convert all element names to camelCase, snake_case, PascalCase, or kebab-case while preserving the data structure.'
        },
        {
          question: 'Can I convert large JSON files?',
          answer: "Yes. The tool handles large JSON documents efficiently, limited only by your browser's available memory."
        }
      ],
      howTo: {
        name: 'How to convert JSON to XML online',
        description: 'Transform JSON into well-formed XML in your browser in three steps.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste JSON',
            text: 'Paste your JSON into the Input editor, or click the Sample button to load an example. Syntax is validated in real time.',
            url: pageUrl + '#input'
          },
          {
            name: 'Choose options',
            text: 'Set the XML root element name and optionally pick a key case transformation such as camelCase or snake_case.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy or download XML',
            text: 'Copy the generated XML to your clipboard or download it as a .xml file.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'JSON Tools', url: 'https://onlinewebdevtools.com/#json-tools' },
        { name: 'JSON to XML', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }

  /**
   * Initialize editor options
   */
  private initializeEditorOptions() {
    this.inputEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'json');
    this.outputEditorOptions = this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'xml');
  }

  // Update editor settings when theme changes
  updateEditorTheme() {
    this.inputEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'json');
    this.outputEditorOptions = this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'xml');
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

  // Обработчик нажатия клавиши ESC для выхода из полноэкранного режима
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event) {
    if (this.isInputFullscreen || this.isOutputFullscreen) {
      // Выходим из полноэкранного режима
      this.isInputFullscreen = false;
      this.isOutputFullscreen = false;

      // Обновляем размер редакторов
      setTimeout(() => {
        if (this.inputMonacoEditor?.editor) {
          this.inputMonacoEditor.editor.layout();
        }
        if (this.outputMonacoEditor?.editor) {
          this.outputMonacoEditor.editor.layout();
        }
      }, 100);
    }
  }

  // Toggle fullscreen mode for the specified editor
  toggleFullscreen(editorType: 'input' | 'output') {
    if (!this.isBrowser) return;

    if (editorType === 'input') {
      this.isInputFullscreen = !this.isInputFullscreen;

      if (this.isInputFullscreen) {
        // Если переключаем на полноэкранный режим для input, выключаем для output
        this.isOutputFullscreen = false;
      }
    } else {
      this.isOutputFullscreen = !this.isOutputFullscreen;

      if (this.isOutputFullscreen) {
        // Если переключаем на полноэкранный режим для output, выключаем для input
        this.isInputFullscreen = false;
      }
    }

    // Общий флаг полноэкранного режима
    this.isFullscreenMode = this.isInputFullscreen || this.isOutputFullscreen;

    // Resize the editor after toggling fullscreen
    setTimeout(() => {
      if (editorType === 'input' && this.inputMonacoEditor?.editor) {
        this.inputMonacoEditor.editor.layout();
      } else if (editorType === 'output' && this.outputMonacoEditor?.editor) {
        this.outputMonacoEditor.editor.layout();
      }
    }, 100);
  }
}
