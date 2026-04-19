import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, Renderer2, HostBinding, ElementRef, HostListener, DOCUMENT } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';
import { UserPreferencesService, PageSettings } from '../../services/user-preferences.service';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

// Only declare Monaco type for type checking, don't use directly
// It will be accessed dynamically only in browser context
interface Monaco {
  editor: any;
  languages: any;
}

/**
 * Интерфейс для сохранения настроек страницы JSON Query
 */
export interface JsonQuerySettings extends PageSettings {
  recentQueries: string[];
}

@Component({
  selector: 'app-json-query',
  standalone: true,
  imports: [
    FormsModule,
    MonacoEditorLazyComponent,
    AutoCompleteModule,
    ButtonModule,
    ToastModule,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule,
],
  providers: [MessageService],
  templateUrl: './json-query.component.html',
  styleUrl: './json-query.component.scss'
})
export class JsonQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  // Input data
  inputJson: string = '';
  queryString: string = '';
  queryResult: string = '';
  querySuggestions: string[] = [];

  // Максимальное количество сохраняемых запросов
  private readonly MAX_SAVED_QUERIES = 10;

  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;

  editorTheme: string = 'vs-dark'; // Default theme

  // Error handling
  error: string | null = null;

  // For SSR and DOM manipulations
  private schemaScriptElement: HTMLElement | null = null;

  inputEditorOptions: any;

  outputEditorOptions: any;

  isBrowser: boolean = false;
  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private messageService: MessageService,
    private seoService: SeoService,
    private router: Router,
    private userPreferencesService: UserPreferencesService,
    private monacoConfigService: MonacoConfigService
  ) {
    
    // Initialize editor options
    this.initializeEditorOptions();

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

    // Получаем данные из истории (history state)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.inputJson = navigation.extras.state['data'] || '';
      console.log('Data from navigation:', this.inputJson);
    }
  }

  ngOnInit() {
    // Start with empty input
    this.inputJson = '';
    this.queryString = 'data';

    if (this.isBrowser) {
      // Загружаем сохраненные запросы
      this.loadSavedQueries();

      // Альтернативный метод получения данных через history state
      const state = history?.state;
      if (state?.data) {
        this.inputJson = state.data;
        console.log('Data from history state:', this.inputJson);
        this.executeQuery(); // Выполняем запрос сразу после получения данных
      }
    }

    // SEO setup
    this.setupSeo();
  }

  ngAfterViewInit() {
    // No initialization needed
  }

  ngOnDestroy() {
    // Очищаем SEO элементы
    this.seoService.destroy();
  }

  /**
   * Загружает сохраненные запросы из UserPreferencesService
   */
  private loadSavedQueries() {
    if (this.isBrowser) {
      const savedSettings = this.userPreferencesService.loadPageSettings<JsonQuerySettings>('/json-query');
      console.log('Saved settings:', savedSettings);
      if (savedSettings?.recentQueries?.length) {
        // Загружаем сохраненные запросы в качестве подсказок
        this.querySuggestions = savedSettings.recentQueries;
        console.log('Loaded saved queries:', this.querySuggestions);
      } else {
        // Устанавливаем базовые подсказки, если нет сохраненных
        this.querySuggestions = [
          'data.users.filter(u => u.active)',
          'data.users.filter(u => u.active).map(u => u.name)',
          'data.users.filter(u => u.active).map(u => u.email)'
        ];
      }
    }
  }

  /**
   * Сохраняет текущий запрос в историю
   */
  private saveQueryToHistory(query: string) {
    if (!this.isBrowser || !query || query === 'data') return;
    
    // Удаляем этот же запрос из истории, если он уже есть
    const existingIndex = this.querySuggestions.indexOf(query);
    if (existingIndex !== -1) {
      this.querySuggestions.splice(existingIndex, 1);
    }
    
    // Добавляем запрос в начало массива
    this.querySuggestions.unshift(query);
    
    // Ограничиваем количество сохраненных запросов
    if (this.querySuggestions.length > this.MAX_SAVED_QUERIES) {
      this.querySuggestions = this.querySuggestions.slice(0, this.MAX_SAVED_QUERIES);
    }
    
    // Сохраняем в UserPreferencesService
    const settings: JsonQuerySettings = {
      recentQueries: this.querySuggestions
    };
    
    this.userPreferencesService.savePageSettings('/json-query', settings);
    console.log('Saved queries:', this.querySuggestions);
  }

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/json-query';
    const shortDescription = 'Free online JSON Query Explorer. Filter, search and transform JSON with JavaScript expressions and JSONPath-style selectors. Runs in your browser, no upload.';

    const metaData: MetaData = {
      OgTitle: 'JSON Query Explorer Online — JSONPath & JavaScript | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'json query',
        'jsonpath',
        'json explorer',
        'json query tool',
        'jsonpath query online',
        'json search',
        'query json online',
        'json data extraction',
        'json path expression',
        'json filter online',
        'jq online',
        'json transform',
        'json javascript query',
        'online json query'
      ],
      jsonLd: {
        name: 'JSON Query Explorer Online — JSONPath & JavaScript | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Live JSON querying with JavaScript expressions',
          'JSONPath-style navigation (filters, wildcards, recursion)',
          'Dual Monaco editors with syntax highlighting',
          'Instant re-evaluation as you type',
          'Query history and autocomplete suggestions',
          'Copy to clipboard and download as .json',
          'Client-side processing for privacy'
        ]
      },
      faq: [
        {
          question: 'Is this JSON Query tool free to use?',
          answer: "Yes, it's completely free with no registration, ads or usage limits."
        },
        {
          question: 'Do you upload or store my JSON data?',
          answer: 'No. All parsing and query evaluation happens in your browser. Your JSON never leaves your device.'
        },
        {
          question: 'Which query syntax is supported?',
          answer: 'Any valid JavaScript expression. Start from the data variable and chain methods like .filter(), .map(), .reduce(), .find(), or use destructuring and optional chaining.'
        },
        {
          question: 'Can I use JSONPath expressions?',
          answer: 'The tool uses JavaScript as its query language, which covers the same use cases as JSONPath. Every JSONPath pattern has a direct equivalent in JavaScript — for example $.users[*].name becomes data.users.map(u => u.name).'
        },
        {
          question: 'Can the explorer handle large JSON files?',
          answer: 'Yes. The parser is the native browser engine, so the only limit is the amount of memory your browser tab can allocate. Documents of several megabytes query smoothly.'
        },
        {
          question: 'What happens when my query throws an error?',
          answer: 'The error message is shown directly below the query input so you can fix the expression without losing your input JSON or previous results.'
        },
        {
          question: 'Does the tool remember my previous queries?',
          answer: 'Yes. Recently used queries are stored locally in your browser and resurface as autocomplete suggestions the next time you open the page.'
        }
      ],
      howTo: {
        name: 'How to query JSON online',
        description: 'Extract data from a JSON document in three steps using JavaScript or JSONPath-style expressions.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste JSON',
            text: 'Paste your JSON into the Input editor on the left, or click the Sample button to load a realistic example.',
            url: pageUrl + '#input'
          },
          {
            name: 'Write a query',
            text: 'Type a JavaScript expression starting from the data variable, for example data.users.filter(u => u.active).map(u => u.name). The result updates on every keystroke.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy or download results',
            text: 'Copy the pretty-printed output to your clipboard or download it as a .json file.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'JSON Tools', url: 'https://onlinewebdevtools.com/#json-tools' },
        { name: 'JSON Query', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
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
      this.inputEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'json');
      this.outputEditorOptions = this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'json');
    }
  }

  /**
   * Initialize editor options
   */
  private initializeEditorOptions() {
    this.inputEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'json');
    this.outputEditorOptions = this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'json');
  }

  search(event: any) {
    if (event.query) {
      // Фильтруем подсказки на основе введенного текста
      const filteredSuggestions = this.querySuggestions.filter(
        suggestion => suggestion.toLowerCase().includes(event.query.toLowerCase())
      );

      // Возвращаем отфильтрованные подсказки или все, если фильтр не дал результатов
      this.querySuggestions = filteredSuggestions.length ? filteredSuggestions : this.querySuggestions;
    }
    this.querySuggestions = [...this.querySuggestions];
  }

  saveQueryString() {

    if(this.queryString.trim() == 'data'){
      return;
    }
    if(this.queryString.trim() == ''){
      return;
    }
    if(this.queryString.trim() == 'data.orders.filter(order => order.price > 1000).map(order => ({ id: order.id, product: order.product }))'){
      return;
    }
    if(this.queryResult){
      this.saveQueryToHistory(this.queryString);
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

  /**
   * Обработчик нажатия клавиши ESC для выхода из полноэкранного режима
   */
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

  /**
   * Toggle fullscreen mode for the specified editor
   */
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