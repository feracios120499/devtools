import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, Renderer2, ElementRef, HostListener, HostBinding, DOCUMENT } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { UserPreferencesService, HexToBase64Settings } from '../../services/user-preferences.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

// Only declare Monaco type for type checking, don't use directly
// It will be accessed dynamically only in browser context
interface Monaco {
  editor: any;
  languages: any;
}

// Интерфейс для опций форматирования Base64
interface Base64FormatOption {
  label: string;
  value: string;
  example: string;
  formatter: (base64: string) => string;
}

@Component({
  selector: 'app-hex-to-base64',
  standalone: true,
  imports: [
    FormsModule,
    MonacoEditorLazyComponent,
    ButtonModule,
    SelectModule,
    ToastModule,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule
],
  providers: [MessageService],
  templateUrl: './hex-to-base64.component.html',
  styleUrl: './hex-to-base64.component.scss'
})
export class HexToBase64Component implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  inputCode: string = '';
  outputCode: string = '';
  
  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;
  
  // Тема редактора
  editorTheme: string = 'vs-dark'; // Default theme
  
  // URL текущей страницы для хранения настроек
  private pageUrl: string = 'hex-to-base64';
  
  // Опции форматирования Base64
  base64FormatOptions: Base64FormatOption[] = [
    { 
      label: 'Standard', 
      value: 'standard', 
      example: 'SGVsbG8gV29ybGQ=',
      formatter: (base64: string) => base64 
    },
    { 
      label: 'URL Safe', 
      value: 'urlsafe', 
      example: 'SGVsbG8gV29ybGQ-',
      formatter: (base64: string) => {
        return base64.replace(/\+/g, '-').replace(/\//g, '_');
      }
    },
    { 
      label: 'With Line Breaks (76 chars)', 
      value: 'linebreaks', 
      example: 'SGVsbG8gV29ybGQ=\n',
      formatter: (base64: string) => {
        let result = '';
        for (let i = 0; i < base64.length; i += 76) {
          result += base64.substring(i, i + 76) + '\n';
        }
        return result.trim();
      }
    }
  ];
  
  // Default format selection
  selectedFormat: Base64FormatOption = this.base64FormatOptions[0];
  
  // Настройки для редакторов
  inputEditorOptions: any;
  
  outputEditorOptions: any;
  
  isBrowser: boolean = false;
  
  // Полноэкранный режим
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
    private router: Router,
    private userPreferencesService: UserPreferencesService,
    private seoService: SeoService,
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

    // Получаем данные из истории (history state) в конструкторе
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const receivedData = navigation.extras.state['data'] || '';
      if (receivedData) {
        this.inputCode = receivedData;
        console.log('Data from navigation:', receivedData);
      }
    }
  }

  ngOnInit() {
    // Альтернативный метод получения данных через history state
    if (this.isBrowser) {
      const state = history.state;
      if (state?.data && !this.inputCode) {
        this.inputCode = state.data;
        console.log('Data from history state:', state.data);
        // Конвертируем данные сразу после получения
        this.convertHexToBase64();
        // Очищаем state чтобы избежать повторного использования при обновлении
        history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Start with empty input if no data received
    if (!this.inputCode) {
      this.inputCode = '';
    } else {
      this.convertHexToBase64();
    }
    
    // Загружаем сохраненные настройки
    this.loadUserPreferences();
    
    // SEO setup
    this.setupSeo();
    
    // Устанавливаем заголовок страницы
    this.pageTitleService.setTitle('HEX to Base64 Converter');
  }
  
  ngAfterViewInit() {
    // No specific action needed for AfterViewInit
  }
  
  ngOnDestroy() {
    // Очищаем SEO-элементы при уничтожении компонента
    this.seoService.destroy();
  }
  
  /**
   * Загружает пользовательские настройки из localStorage
   */
  private loadUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings = this.userPreferencesService.loadPageSettings<HexToBase64Settings>(this.pageUrl);
    
    if (settings) {
      // Если есть сохраненный формат, находим его в опциях и устанавливаем
      if (settings.selectedFormatValue) {
        const savedFormat = this.base64FormatOptions.find(option => option.value === settings.selectedFormatValue);
        if (savedFormat) {
          this.selectedFormat = savedFormat;
        }
      }
    }
  }
  
  /**
   * Сохраняет пользовательские настройки в localStorage
   */
  private saveUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings: HexToBase64Settings = {
      selectedFormatValue: this.selectedFormat.value
    };
    
    this.userPreferencesService.savePageSettings(this.pageUrl, settings);
  }
  
  /**
   * Handles format option change
   */
  onFormatChange() {
    // Сохраняем выбранный формат
    this.saveUserPreferences();
    
    // Повторная конвертация с новым форматом вывода
    this.convertHexToBase64();
  }
  
  /**
   * Копирование текста в буфер обмена
   */
  copyToClipboard() {
    if (!this.isBrowser || !this.outputCode) return;
    
    navigator.clipboard.writeText(this.outputCode).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: 'Base64 copied to clipboard',
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
   * Скачивание результата
   */
  downloadBase64() {
    if (!this.isBrowser || !this.outputCode) return;
    
    const blob = new Blob([this.outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64-output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Downloaded!',
      detail: 'Base64 output downloaded as text file',
      life: 3000
    });
  }
  
  /**
   * Вставка из буфера обмена
   */
  pasteFromClipboard() {
    if (!this.isBrowser) return;
    
    navigator.clipboard.readText().then((text) => {
      this.inputCode = text;
      this.convertHexToBase64();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Pasted!',
        detail: 'HEX data pasted from clipboard',
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
   * Загрузка примера HEX
   */
  loadSampleHex() {
    // Пример HEX для Hello World
    this.inputCode = '48656C6C6F20576F726C64';
    this.convertHexToBase64();
  }
  
  /**
   * Очистка полей ввода и вывода
   */
  clearInput() {
    this.inputCode = '';
    this.outputCode = '';
  }
  
  /**
   * Обновление страницы
   */
  reloadPage() {
    if (this.isBrowser) {
      window.location.reload();
    }
  }
  
  // Setup metadata for SEO. FAQ/HowTo mirror visible HTML content.
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/hex-to-base64';
    const shortDescription = 'Convert HEX to Base64 online for free. Fast, private, client-side tool with standard, URL-safe and MIME line-wrapped Base64 output.';

    const metaData: MetaData = {
      OgTitle: 'HEX to Base64 Converter | Free & Fast Online Tool – DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'hex to base64',
        'hex to base64 converter',
        'hexadecimal to base64',
        'hex encoder',
        'base64 encoder',
        'url safe base64',
        'base64 line breaks',
        'encoding converter'
      ],
      jsonLd: {
        name: 'HEX to Base64 Converter',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Encodes hexadecimal to standard RFC 4648 Base64',
          'Accepts plain, dashed, 0x-prefixed, colon and space HEX formats',
          'Three Base64 output flavors: Standard, URL Safe and 76-char line breaks',
          'Copy to clipboard and download as .txt file',
          'Client-side processing for privacy',
          'Fullscreen Monaco editor with dark / light themes',
          'Remembers your preferred format in local storage'
        ]
      },
      faq: [
        {
          question: 'Is this HEX to Base64 converter free?',
          answer: "Yes, it's completely free with no registration, ads, or usage limits."
        },
        {
          question: 'What happens if my HEX is invalid?',
          answer: 'The tool validates the input against [0-9A-Fa-f] after stripping separators. If non-hex characters are found, an error toast appears and the output shows "Error: Invalid hexadecimal input".'
        },
        {
          question: 'What if my HEX string has an odd number of characters?',
          answer: 'A single leading 0 is automatically prepended so the string can be split into whole bytes before Base64 encoding.'
        },
        {
          question: 'Does it support URL-safe Base64?',
          answer: 'Yes. Pick "URL Safe" from the format dropdown — + becomes - and / becomes _, compatible with JWTs and query strings.'
        },
        {
          question: 'Is there a maximum input size?',
          answer: 'There is no hard-coded limit, but since everything happens in the browser, performance depends on your device. Multi-megabyte HEX inputs are handled comfortably on modern machines.'
        },
        {
          question: 'Is it safe to paste sensitive hex data?',
          answer: 'Yes — all encoding runs locally in your browser, nothing is sent to a server. You can even use it offline after the page has loaded.'
        },
        {
          question: 'Can I convert Base64 back to HEX?',
          answer: 'Yes — use the reverse tool: Base64 to HEX converter at /base64-to-hex.'
        }
      ],
      howTo: {
        name: 'How to convert HEX to Base64 online',
        description: 'Encode hexadecimal data into Base64 in three steps, fully in the browser.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste HEX',
            text: 'Paste your hexadecimal string into the Input HEX editor, or click Sample to load an example. Plain, dashed, 0x-prefixed, colon and space formats are all accepted.',
            url: pageUrl + '#input'
          },
          {
            name: 'Pick options',
            text: 'Choose the Base64 output format: Standard, URL Safe, or With Line Breaks (76 chars).',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy or download Base64',
            text: 'Copy the result to your clipboard or download it as a .txt file.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Encoding Tools', url: 'https://onlinewebdevtools.com/#encoding-tools' },
        { name: 'HEX to Base64', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }
  
  /**
   * Обновление темы редакторов Monaco
   */
  updateEditorTheme() {
    this.inputEditorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80
    };
    this.outputEditorOptions = {
      ...this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80
    };
    
    // Update editors if they exist
    if (this.inputMonacoEditor?._editor) {
      this.inputMonacoEditor._editor.updateOptions({ theme: this.editorTheme });
    }
    
    if (this.outputMonacoEditor?._editor) {
      this.outputMonacoEditor._editor.updateOptions({ theme: this.editorTheme });
    }
  }
  
  /**
   * Initialize editor options
   */
  private initializeEditorOptions() {
    this.inputEditorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80
    };
    this.outputEditorOptions = {
      ...this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80
    };
  }
  
  /**
   * Конвертация HEX в Base64
   */
  convertHexToBase64() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }
    
    try {
      // Нормализуем HEX-строку (удаляем пробелы, тире, двоеточия и префикс 0x)
      let normalizedHex = this.normalizeHexInput(this.inputCode);
      
      // Проверяем, что строка содержит только hex-символы
      if (!/^[0-9A-Fa-f]*$/.test(normalizedHex)) {
        throw new Error('Invalid hexadecimal input');
      }
      
      // Если длина нечетная, добавляем ведущий ноль
      if (normalizedHex.length % 2 !== 0) {
        normalizedHex = '0' + normalizedHex;
      }
      
      // Преобразуем HEX в бинарные данные
      const bytes = this.hexToBytes(normalizedHex);
      
      // Преобразуем бинарные данные в Base64
      let base64 = this.bytesToBase64(bytes);
      
      // Применяем выбранный формат
      this.outputCode = this.selectedFormat.formatter(base64);
      
    } catch (e) {
      console.error('Error converting HEX to Base64:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: e instanceof Error ? e.message : 'Invalid hexadecimal input',
        life: 3000
      });
      this.outputCode = 'Error: Invalid hexadecimal input';
    }
  }
  
  /**
   * Нормализует HEX строку, удаляя разделители и префиксы
   * @param hex HEX строка
   * @returns Нормализованная HEX строка
   */
  normalizeHexInput(hex: string): string {
    // Удаляем пробелы, табуляции, переносы строк, тире, двоеточия
    hex = hex.replace(/[\s\n\r\-:]/g, '');
    
    // Удаляем префиксы 0x
    hex = hex.replace(/0x/gi, '');
    
    return hex;
  }
  
  /**
   * Преобразует HEX строку в массив байтов
   * @param hex HEX строка
   * @returns Uint8Array массив байтов
   */
  hexToBytes(hex: string): Uint8Array {
    // Проверяем, что длина строки четная
    if (hex.length % 2 !== 0) {
      throw new Error('Hex string must have an even length');
    }
    
    const bytes = new Uint8Array(hex.length / 2);
    
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substring(i, i + 2), 16);
      bytes[i / 2] = byte;
    }
    
    return bytes;
  }
  
  /**
   * Преобразует массив байтов в Base64 строку
   * @param bytes Массив байтов
   * @returns Base64 строка
   */
  bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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
        if (this.inputMonacoEditor?._editor) {
          this.inputMonacoEditor._editor.layout();
        }
        if (this.outputMonacoEditor?._editor) {
          this.outputMonacoEditor._editor.layout();
        }
      }, 100);
    }
  }
  
  /**
   * Переключение в полноэкранный режим и обратно
   */
  toggleFullscreen(editorType: 'input' | 'output') {
    if (!this.isBrowser) return;
    
    if (editorType === 'input') {
      this.isInputFullscreen = !this.isInputFullscreen;
      if (this.isInputFullscreen) {
        this.isOutputFullscreen = false;
      }
    } else {
      this.isOutputFullscreen = !this.isOutputFullscreen;
      if (this.isOutputFullscreen) {
        this.isInputFullscreen = false;
      }
    }
    
    // Resize the editor after toggling fullscreen
    setTimeout(() => {
      if (editorType === 'input' && this.inputMonacoEditor?._editor) {
        this.inputMonacoEditor._editor.layout();
      } else if (editorType === 'output' && this.outputMonacoEditor?._editor) {
        this.outputMonacoEditor._editor.layout();
      }
    }, 100);
  }
} 