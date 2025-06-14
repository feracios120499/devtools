import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, ElementRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MenuItem, MessageService } from 'primeng/api';
import { camelCase, snakeCase, pascalCase, kebabCase } from 'change-case';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { MonacoScrollFixDirective } from '../../shared/directives/monaco-scroll-fix.directive';
import { Router } from '@angular/router';
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
    CommonModule,
    FormsModule,
    MonacoEditorModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule,
    MonacoScrollFixDirective,
    AnchorHeadingDirective
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
  handleEscapeKey(event: KeyboardEvent) {
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
   * Настройка SEO-метаданных через SeoService
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'JSON Formatter, Beautifier & Viewer Online | DevTool',
      OgDescription: 'Format, beautify and validate JSON online. This free DevTool lets you preview JSON with indentation, syntax checking, and export — fast and secure in your browser.',
      description: 'Format, beautify and validate JSON online. This free DevTool lets you preview JSON with indentation, syntax checking, and export — fast and secure in your browser.',
      keywords: ['JSON formatter', 'JSON beautifier', 'JSON viewer', 'format JSON online',
        'JSON validator', 'JSON lint', 'JSON pretty print', 'JSON editor',
        'online JSON tool', 'view JSON online', 'JSON highlighter', 'clean JSON',
        'JSON checker', 'beautify JSON'],
      jsonLd: {
        name: 'JSON Formatter, Beautifier & Viewer Online | DevTool',
        description: 'Format, beautify and validate JSON online. This free DevTool lets you preview JSON with indentation, syntax checking, and export — fast and secure in your browser.',
        url: 'https://onlinewebdevtools.com/json-formatter'
      }
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