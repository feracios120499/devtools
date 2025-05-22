import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, Renderer2, ElementRef, HostListener, HostBinding } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { UserPreferencesService, PageSettings } from '../../services/user-preferences.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';
// Only declare Monaco type for type checking, don't use directly
// It will be accessed dynamically only in browser context
interface Monaco {
  editor: any;
  languages: any;
}

interface FormatOption {
  label: string;
  value: string;
}

interface SeparatorOption {
  label: string;
  value: string;
}

interface YamlSubformatOption {
  label: string;
  value: string;
}

// Добавляем новый интерфейс для опции сохранения регистра
interface CasePreservationOption {
  label: string;
  value: boolean;
}

/**
 * Интерфейс для сохранения настроек страницы JSON to ENV
 */
export interface JsonToEnvSettings extends PageSettings {
  format: string;
  yamlSubformat: string;
  separator: string;
  preserveCase: boolean;
}

@Component({
  selector: 'app-json-to-env',
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
  templateUrl: './json-to-env.component.html',
  styleUrl: './json-to-env.component.scss'
})
export class JsonToEnvComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  inputCode: string = '';
  outputCode: string = '';

  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;

  editorTheme: string = 'vs-dark'; // Default theme

  // Format options
  formatOptions: FormatOption[] = [
    { label: 'Docker', value: 'docker' },
    { label: 'YAML', value: 'yaml' }
  ];
  selectedFormat: FormatOption = this.formatOptions[0];

  // YAML Subformat options (visible when YAML is selected)
  yamlSubformatOptions: YamlSubformatOption[] = [
    { label: 'Docker', value: 'docker' },
    { label: 'Compose', value: 'compose' },
    { label: 'Kubernetes', value: 'kubernetes' },
    { label: 'Azure App Settings (JSON)', value: 'azure' }
  ];
  selectedYamlSubformat: YamlSubformatOption = this.yamlSubformatOptions[0];

  // Separator options
  separatorOptions: SeparatorOption[] = [
    { label: 'Colon (:)', value: ':' },
    { label: 'Underscores (__)', value: '__' }
  ];
  selectedSeparator: SeparatorOption = this.separatorOptions[0];

  // Опции сохранения регистра
  casePreservationOptions: CasePreservationOption[] = [
    { label: 'Preserve original case', value: true },
    { label: 'Convert to uppercase', value: false }
  ];
  selectedCasePreservation: CasePreservationOption = this.casePreservationOptions[0];

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
    },
    fixedOverflowWidgets: true
  };

  outputEditorOptions = {
    theme: this.editorTheme,
    language: 'plaintext',
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
  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;

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
    private userPreferencesService: UserPreferencesService,
    private seoService: SeoService,
    private router: Router,
    private route: ActivatedRoute
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
    this.pageTitleService.setTitle('JSON to ENV Converter');

    // Получаем данные из истории (history state)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.inputCode = navigation.extras.state['data'] || '';
      console.log('Data from navigation:', this.inputCode);
    }
  }

  ngOnInit() {
    // Start with empty input
    this.inputCode = '';
    if (this.isBrowser) {
      // Альтернативный метод получения данных через history state
      const state = history.state;
      if (state?.data) {
        this.inputCode = state.data;
        console.log('Data from history state:', this.inputCode);
        this.convertJsonToEnv(); // Конвертируем данные сразу после получения
      }
    }

    // Загрузка сохраненных настроек
    this.loadSavedSettings();

    // SEO setup
    this.setupSeo();
  }

  ngAfterViewInit() {
    // No initialization needed
  }

  ngOnDestroy() {
    // Очищаем SEO элементы при уничтожении компонента
    this.seoService.destroy();

    // Корректно уничтожаем экземпляры Monaco Editor, если они существуют
    if (this.isBrowser) {
      if (this.inputMonacoEditor?.editor) {
        this.inputMonacoEditor.editor.dispose();
      }
      if (this.outputMonacoEditor?.editor) {
        this.outputMonacoEditor.editor.dispose();
      }
    }
  }

  /**
   * Загружает сохраненные настройки из UserPreferencesService
   */
  private loadSavedSettings() {
    if (this.isBrowser) {
      const savedSettings = this.userPreferencesService.loadPageSettings<JsonToEnvSettings>('/json-to-env');

      if (savedSettings) {
        // Определяем формат
        const formatOption = this.formatOptions.find(opt => opt.value === savedSettings.format);
        if (formatOption) {
          this.selectedFormat = formatOption;
        }

        // Определяем YAML подформат
        const yamlSubformatOption = this.yamlSubformatOptions.find(opt => opt.value === savedSettings.yamlSubformat);
        if (yamlSubformatOption) {
          this.selectedYamlSubformat = yamlSubformatOption;
        }

        // Определяем разделитель
        const separatorOption = this.separatorOptions.find(opt => opt.value === savedSettings.separator);
        if (separatorOption) {
          this.selectedSeparator = separatorOption;
        }

        // Определяем сохранение регистра
        const preserveCaseOption = this.casePreservationOptions.find(opt => opt.value === savedSettings.preserveCase);
        if (preserveCaseOption) {
          this.selectedCasePreservation = preserveCaseOption;
        }
      }
    }
  }

  /**
   * Сохраняет текущие настройки в UserPreferencesService
   */
  private saveSettings() {
    if (this.isBrowser) {
      const settings: JsonToEnvSettings = {
        format: this.selectedFormat.value,
        yamlSubformat: this.selectedYamlSubformat.value,
        separator: this.selectedSeparator.value,
        preserveCase: this.selectedCasePreservation.value
      };

      this.userPreferencesService.savePageSettings('/json-to-env', settings);
    }
  }


  /**
   * When format changes
   */
  onFormatChange() {
    // Перевести вывод
    this.convertJsonToEnv();
    // Сохранить настройки
    this.saveSettings();
  }

  /**
   * When YAML subformat changes
   */
  onYamlSubformatChange() {
    // Перевести вывод, только если выбран YAML
    if (this.selectedFormat.value === 'yaml') {
      this.convertJsonToEnv();
    }
    // Сохранить настройки
    this.saveSettings();
  }

  /**
   * When separator changes
   */
  onSeparatorChange() {
    // Перевести вывод
    this.convertJsonToEnv();
    // Сохранить настройки
    this.saveSettings();
  }

  /**
   * When case preservation option changes
   */
  onCasePreservationChange() {
    // Перевести вывод
    this.convertJsonToEnv();
    // Сохранить настройки
    this.saveSettings();
  }

  /**
   * Copy formatted ENV to clipboard
   */
  copyToClipboard() {
    if (!this.isBrowser || !this.outputCode) return;

    navigator.clipboard.writeText(this.outputCode).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: 'Output copied to clipboard',
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
   * Download output as file
   */
  downloadOutput() {
    if (!this.isBrowser || !this.outputCode) return;

    let fileName = 'env-config';
    let mimeType = 'text/plain';

    // Determine file name and type based on format
    if (this.selectedFormat.value === 'docker') {
      fileName = '.env';
    } else if (this.selectedFormat.value === 'yaml') {
      fileName = 'config.yaml';
      mimeType = 'application/yaml';
    }

    const blob = new Blob([this.outputCode], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Paste from clipboard
   */
  pasteFromClipboard() {
    if (!this.isBrowser) return;

    navigator.clipboard.readText().then(text => {
      this.inputCode = text;
      try {
        // Try to parse and format the JSON
        // This will also convert to ENV
        this.formatJson();
      } catch (e) {
        console.error('Failed to parse JSON from clipboard:', e);
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid JSON',
          detail: 'The pasted text is not valid JSON',
          life: 3000
        });
      }
    }).catch(err => {
      console.error('Failed to read from clipboard:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to read from clipboard',
        life: 3000
      });
    });
  }

  /**
   * Load sample JSON
   */
  loadSampleJson() {
    const sampleJson = {
      "app": {
        "name": "MyApp",
        "environment": "production",
        "debug": false
      },
      "database": {
        "host": "localhost",
        "port": 5432,
        "username": "user",
        "password": "password123",
        "maxConnections": 100
      },
      "api": {
        "url": "https://api.example.com",
        "timeout": 30000,
        "retryAttempts": 3
      },
      "features": {
        "enableLogging": true,
        "cacheEnabled": true,
        "analyticsTrackingId": "UA-12345-6"
      }
    };

    this.inputCode = JSON.stringify(sampleJson, null, 2);
    this.convertJsonToEnv();
  }

  /**
   * Clear JSON
   */
  clearJson() {
    this.inputCode = '';
    this.outputCode = '';
  }

  /**
   * Настройка SEO для страницы
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'JSON to ENV Converter | DevTools',
      OgDescription: 'Free online JSON to ENV converter. Transform complex JSON structures into .env files, YAML, Docker Compose, and Kubernetes configurations.',
      description: 'Free online tool to convert JSON to environment variables (.env), YAML, Docker Compose, or Kubernetes configurations. Perfect for simplifying configuration management across different environments and platforms.',
      keywords: ['json to env', 'json to yaml', 'json converter', 'env file generator', 'docker env', 'kubernetes yaml', 'configuration converter', 'json to environment variables'],
      jsonLd: {
        name: 'JSON to ENV Converter',
        description: 'Free online tool for converting JSON to environment variables, Docker .env, or YAML formats',
        url: 'https://onlinewebdevtools.com/json-to-env'
      }
    };

    this.seoService.setupSeo(metaData);
  }

  /**
   * Update themes for Monaco editors
   */
  updateEditorTheme() {
    if (!this.isBrowser) return;

    this.ngZone.runOutsideAngular(() => {
      this.inputEditorOptions = { ...this.inputEditorOptions, theme: this.editorTheme };
      this.outputEditorOptions = { ...this.outputEditorOptions, theme: this.editorTheme };

      // Update editor instances if they exist
      if (this.inputMonacoEditor?.editor) {
        this.inputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
      }

      if (this.outputMonacoEditor?.editor) {
        this.outputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
      }
    });
  }

  /**
   * Format JSON in the input editor
   */
  formatJson() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }

    try {
      // Parse JSON
      const parsedJson = JSON.parse(this.inputCode);

      // Format JSON in input editor
      this.inputCode = JSON.stringify(parsedJson, null, 2);

      // Convert to ENV
      this.convertJsonToEnv();
    } catch (e) {
      console.error('Error formatting JSON:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid JSON',
        detail: 'Please check your JSON syntax',
        life: 3000
      });
    }
  }

  /**
   * Convert JSON to ENV format
   */
  convertJsonToEnv() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }

    try {
      // Parse JSON
      const parsedJson = JSON.parse(this.inputCode);

      // Convert to the selected format
      if (this.selectedFormat.value === 'docker') {
        this.outputCode = this.jsonToDockerEnv(parsedJson);
      } else if (this.selectedFormat.value === 'yaml') {
        this.outputCode = this.jsonToYaml(parsedJson);
      }
    } catch (e) {
      console.error('Error converting JSON to ENV:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Conversion Error',
        detail: 'Error converting JSON to the selected format',
        life: 3000
      });
    }
  }

  /**
   * Convert JSON to Docker .env format
   */
  private jsonToDockerEnv(json: any): string {
    const envLines: string[] = [];
    const separator = this.selectedSeparator.value;
    const preserveCase = this.selectedCasePreservation.value;

    // Recursive function to flatten JSON
    const flatten = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}${separator}${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recurse for nested objects
          flatten(value, newKey);
        } else {
          // Format value appropriately
          let formattedValue = value;

          if (typeof value === 'string') {
            // Escape quotes in string
            formattedValue = `"${value.replace(/"/g, '\\"')}"`;
          } else if (Array.isArray(value)) {
            // Convert array to string
            formattedValue = `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
          } else if (value === null) {
            formattedValue = '""';
          }

          // Apply case transformation if needed
          const envKey = preserveCase ? newKey : newKey.toUpperCase();
          envLines.push(`${envKey}=${formattedValue}`);
        }
      }
    };

    flatten(json);
    return envLines.join('\n');
  }

  /**
   * Convert JSON to YAML format with selected subformat
   */
  private jsonToYaml(json: any): string {
    // Basic JSON to YAML conversion
    const yamlLines: string[] = [];

    // Handle different YAML subformats
    switch (this.selectedYamlSubformat.value) {
      case 'docker':
        return this.jsonToDockerYaml(json);
      case 'compose':
        return this.jsonToComposeYaml(json);
      case 'kubernetes':
        return this.jsonToKubernetesYaml(json);
      case 'azure':
        return this.jsonToAzureYaml(json);
      default:
        return this.jsonToDockerYaml(json);
    }
  }

  /**
   * Convert JSON to Docker YAML format
   */
  private jsonToDockerYaml(json: any): string {
    const yamlLines: string[] = [];
    const separator = this.selectedSeparator.value;
    const preserveCase = this.selectedCasePreservation.value;

    // Add docker-compose version
    yamlLines.push('version: "3"');
    yamlLines.push('services:');
    yamlLines.push('  app:');
    yamlLines.push('    environment:');

    // Recursive function to flatten JSON
    const flatten = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}${separator}${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recurse for nested objects
          flatten(value, newKey);
        } else {
          // Format value appropriately
          let formattedValue = value;

          if (typeof value === 'string') {
            // Use quotes for strings with special characters
            if (/[:#{}[\],&*?|<>=!%@`]/.test(value)) {
              formattedValue = `"${value.replace(/"/g, '\\"')}"`;
            }
          } else if (Array.isArray(value)) {
            // Convert array to YAML format
            formattedValue = JSON.stringify(value);
          } else if (value === null) {
            formattedValue = 'null';
          }

          // Apply case transformation if needed
          const envKey = preserveCase ? newKey : newKey.toUpperCase();
          yamlLines.push(`      ${envKey}: ${formattedValue}`);
        }
      }
    };

    flatten(json);
    return yamlLines.join('\n');
  }

  /**
   * Convert JSON to Docker Compose YAML format
   */
  private jsonToComposeYaml(json: any): string {
    const yamlLines: string[] = [];

    // Add compose file header
    yamlLines.push('version: "3"');
    yamlLines.push('services:');
    yamlLines.push('  app:');
    yamlLines.push('    image: your-app-image');
    yamlLines.push('    environment:');

    // Add environment variables
    const envVars = this.flattenJson(json);
    for (const [key, value] of Object.entries(envVars)) {
      yamlLines.push(`      - ${key}=${this.formatYamlValue(value)}`);
    }

    // Add some default configuration
    yamlLines.push('    ports:');
    yamlLines.push('      - "3000:3000"');
    yamlLines.push('    restart: unless-stopped');

    return yamlLines.join('\n');
  }

  /**
   * Convert JSON to Kubernetes YAML format
   */
  private jsonToKubernetesYaml(json: any): string {
    const yamlLines: string[] = [];

    // Add Kubernetes ConfigMap
    yamlLines.push('apiVersion: v1');
    yamlLines.push('kind: ConfigMap');
    yamlLines.push('metadata:');
    yamlLines.push('  name: app-config');
    yamlLines.push('data:');

    // Add config data
    const flatJson = this.flattenJson(json);
    for (const [key, value] of Object.entries(flatJson)) {
      yamlLines.push(`  ${key}: ${this.formatYamlValue(value)}`);
    }

    // Add Kubernetes Deployment
    yamlLines.push('---');
    yamlLines.push('apiVersion: apps/v1');
    yamlLines.push('kind: Deployment');
    yamlLines.push('metadata:');
    yamlLines.push('  name: app-deployment');
    yamlLines.push('spec:');
    yamlLines.push('  replicas: 1');
    yamlLines.push('  selector:');
    yamlLines.push('    matchLabels:');
    yamlLines.push('      app: my-app');
    yamlLines.push('  template:');
    yamlLines.push('    metadata:');
    yamlLines.push('      labels:');
    yamlLines.push('        app: my-app');
    yamlLines.push('    spec:');
    yamlLines.push('      containers:');
    yamlLines.push('      - name: app');
    yamlLines.push('        image: your-app-image');
    yamlLines.push('        envFrom:');
    yamlLines.push('        - configMapRef:');
    yamlLines.push('            name: app-config');

    return yamlLines.join('\n');
  }

  /**
   * Convert JSON to Azure App Settings (JSON) format
   */
  private jsonToAzureYaml(json: any): string {
    // Azure App Settings are in JSON format
    const azureSettings: any = {
      properties: {
        configuration: {
          appSettings: []
        }
      }
    };

    // Create app settings array from flattened JSON
    const flatJson = this.flattenJson(json);
    for (const [key, value] of Object.entries(flatJson)) {
      azureSettings.properties.configuration.appSettings.push({
        name: key,
        value: String(value)
      });
    }

    return JSON.stringify(azureSettings, null, 2);
  }

  /**
   * Helper to flatten nested JSON object with separator
   */
  private flattenJson(json: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};
    const separator = this.selectedSeparator.value;
    const preserveCase = this.selectedCasePreservation.value;

    for (const key in json) {
      const value = json[key];
      const newKey = prefix ? `${prefix}${separator}${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recurse for nested objects
        const nestedKeys = this.flattenJson(value, newKey);
        Object.assign(result, nestedKeys);
      } else {
        // Add leaf value - apply case transformation if needed
        const resultKey = preserveCase ? newKey : newKey.toUpperCase();
        result[resultKey] = value;
      }
    }

    return result;
  }

  /**
   * Format a value for YAML output
   */
  private formatYamlValue(value: any): string {
    if (typeof value === 'string') {
      // Use quotes for strings with special characters
      if (/[:#{}[\],&*?|<>=!%@`]/.test(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    } else if (Array.isArray(value)) {
      return JSON.stringify(value);
    } else if (value === null) {
      return 'null';
    } else {
      return String(value);
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

    // Resize the editor after toggling fullscreen
    setTimeout(() => {
      if (editorType === 'input' && this.inputMonacoEditor?.editor) {
        this.inputMonacoEditor.editor.layout();
      } else if (editorType === 'output' && this.outputMonacoEditor?.editor) {
        this.outputMonacoEditor.editor.layout();
      }
    }, 100);
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
} 