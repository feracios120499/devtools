import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, ElementRef, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { camelCase, snakeCase, pascalCase, kebabCase } from 'change-case';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { Router, RouterModule } from '@angular/router';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

// Интерфейсы для типизации
interface SpacingOption {
  label: string;
  value: number;
}

interface KeyCaseOption {
  label: string;
  value: string;
  transform: (key: string) => string;
}

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [
    FormsModule,
    MonacoEditorLazyComponent,
    ButtonModule,
    RippleModule,
    SelectModule,
    SplitButtonModule,
    TieredMenuModule,
    ToastModule,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule
],
  providers: [MessageService],
  templateUrl: './json-formatter.component.html',
  styleUrl: './json-formatter.component.scss'
})
export class JsonFormatterComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'dt-page';
  inputCode: string = '';
  outputCode: string = '';

  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;

  editorTheme: string = 'vs-dark'; // Default theme

  // Spacing options for the dropdown
  spacingOptions: SpacingOption[] = [
    { label: '2 Spaces', value: 2 },
    { label: '4 Spaces', value: 4 }
  ];

  // Default spacing selection
  selectedSpacing: SpacingOption = this.spacingOptions[0];

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

  inputEditorOptions: any;
  outputEditorOptions: any;

  isBrowser: boolean = false;

  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;

  useJsonInItems: MenuItem[] = [
    {
      label: 'JSON to XML',
      icon: 'file-type-xml',
      routerLink: '/json-to-xml'
    },
    {
      label: 'JSON to ENV',
      icon: 'brand-docker',
      routerLink: '/json-to-env'
    },
    {
      label: 'JSON Query',
      icon: 'pencil-search',
      routerLink: '/json-query'
    }
  ]

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private messageService: MessageService,
    private router: Router,
    private monacoConfigService: MonacoConfigService
  ) {
    // Set page title
    this.pageTitleService.setTitle('JSON Formatter, Beautifier & Viewer');
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Initialize editor options with placeholders
    this.inputEditorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'json'),
      placeholder: 'Paste or type your JSON here...\n\nExample:\n{\n  "name": "John Doe",\n  "age": 30,\n  "city": "New York"\n}'
    };
    this.outputEditorOptions = {
      ...this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'json'),
      placeholder: 'Formatted JSON will appear here...\n\nThe formatter will:\n• Beautify structure with proper indentation\n• Validate JSON syntax\n• Transform key names if needed'
    };

    // React to theme changes in the application, only in browser
    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }
  }

  ngOnInit() {
    this.inputCode = '';
    this.setupSeo();
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

  ngAfterViewInit() {
    // Wheel event handling is now managed by MonacoScrollFixDirective
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  /**
   * Метод для отправки данных на другие страницы через router state
   * @param routerLink путь к странице, на которую будет выполнен переход
   */
  sendData(routerLink: string) {
    this.router.navigate([routerLink], {
      state: {
        data: this.outputCode
      }
    });
  }

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/json-formatter';
    const shortDescription = 'Format, beautify and validate JSON online. Free in-browser JSON beautifier with indentation, syntax check, and export. Try it instantly, no signup.';

    const metaData: MetaData = {
      OgTitle: 'JSON Formatter, Beautifier & Viewer Online | DevTool',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: ['JSON formatter', 'JSON beautifier', 'JSON viewer', 'format JSON online',
        'JSON validator', 'JSON lint', 'JSON pretty print', 'JSON editor',
        'online JSON tool', 'view JSON online', 'JSON highlighter', 'clean JSON',
        'JSON checker', 'beautify JSON'],
      jsonLd: {
        name: 'JSON Formatter, Beautifier & Viewer Online | DevTool',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'JSON formatting with customizable indentation',
          'Real-time JSON syntax validation',
          'Key case transformation (camelCase, snake_case, PascalCase, kebab-case)',
          'Copy to clipboard and download as .json',
          'Client-side processing for privacy',
          'Dark and light editor themes'
        ]
      },
      faq: [
        {
          question: 'Is this JSON formatter free to use?',
          answer: "Yes, it's completely free with no registration, ads, or usage limits."
        },
        {
          question: 'Do you store my JSON data?',
          answer: 'No, all processing is done locally in your browser. Your data never touches our servers.'
        },
        {
          question: 'Can I format large JSON files?',
          answer: "Yes, the tool handles large JSON documents efficiently, limited only by your browser's memory."
        },
        {
          question: 'Does the tool validate JSON syntax?',
          answer: 'Absolutely. It provides real-time syntax validation and error highlighting according to JSON standards.'
        },
        {
          question: "What's the difference between a JSON formatter and a JSON validator?",
          answer: 'A JSON formatter beautifies the structure with indentation and line breaks for readability, while a JSON validator checks that the syntax conforms to the JSON specification. This tool does both in a single pass.'
        },
        {
          question: 'Does the tool support JSON5 or comments (JSONC)?',
          answer: 'The formatter follows the strict RFC 7159 / RFC 8259 JSON specification, so inline comments and JSON5 extensions are not supported. Remove comments before formatting if your input contains them.'
        },
        {
          question: 'Can I transform key names while formatting?',
          answer: 'Yes. Use the key case dropdown to convert all keys to camelCase, snake_case, PascalCase or kebab-case while preserving the data structure.'
        }
      ],
      howTo: {
        name: 'How to format and validate JSON online',
        description: 'Beautify and validate JSON in your browser in three steps.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste or type your JSON',
            text: 'Paste your JSON into the Input editor, or click the Sample button to load an example. Syntax is validated in real time.',
            url: pageUrl + '#input'
          },
          {
            name: 'Configure formatting options',
            text: 'Choose indentation (2 or 4 spaces) and an optional key case transformation such as camelCase or snake_case.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy or download the result',
            text: 'Copy the formatted JSON to your clipboard, download it as a .json file, or send it to another DevTool such as JSON to XML or JSON Query.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'JSON Tools', url: 'https://onlinewebdevtools.com/#json-tools' },
        { name: 'JSON Formatter', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }

  /**
   * Handles spacing option change
   */
  onSpacingChange() {
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
    this.inputCode = `{"exampleString":"exampleData","exampleNumber":123,"exampleArray":[1,2,3]}`;
    this.formatJson();
  }

  /**
   * Clear all JSON input
   */
  clearJson() {
    this.inputCode = '';
    this.outputCode = '';
  }

  // Update editor settings when theme changes
  updateEditorTheme() {
    this.inputEditorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'json'),
      placeholder: 'Paste or type your JSON here...\n\nExample:\n{\n  "name": "John Doe",\n  "age": 30,\n  "city": "New York"\n}'
    };
    this.outputEditorOptions = {
      ...this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'json'),
      placeholder: 'Formatted JSON will appear here...\n\nThe formatter will:\n• Beautify structure with proper indentation\n• Validate JSON syntax\n• Transform key names if needed'
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

      // Transform keys if needed
      const transformedJson = this.selectedKeyCase.value !== 'original'
        ? this.transformJsonKeys(parsedJson, this.selectedKeyCase.transform)
        : parsedJson;

      // Then format with selected spacing
      this.outputCode = this.prettyPrintJson(JSON.stringify(transformedJson));

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

  /**
   * Transform all keys in JSON object using the provided function
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

  /**
   * Handle key case option change
   */
  onKeyCaseChange() {
    this.formatJson();
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