import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, Renderer2, ElementRef, HostListener, HostBinding } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { UserPreferencesService, HexToBase64Settings } from '../../services/user-preferences.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';

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
    CommonModule, 
    FormsModule, 
    MonacoEditorModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule
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
  inputEditorOptions = {
    theme: this.editorTheme,
    language: 'plaintext',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    wordWrap: 'on',
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
    language: 'plaintext',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    readOnly: true,
    wordWrap: 'on',
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
    private seoService: SeoService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // React to theme changes in the application, only in browser
    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }
  }

  ngOnInit() {
    // Start with empty input
    this.inputCode = '';
    
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
  
  /**
   * Настройка SEO для страницы
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'HEX to Base64 Converter | DevTools',
      OgDescription: 'Free online HEX to Base64 converter. Convert hexadecimal data to Base64 encoded format with various output options.',
      description: 'Free online HEX to Base64 converter tool. Easily convert hexadecimal data to Base64 encoding with support for standard Base64, URL-safe Base64, and formatted output with line breaks.',
      keywords: ['hex to base64', 'hex converter', 'base64 encoder', 'hexadecimal to base64', 'hex encoding', 'url safe base64'],
      jsonLd: {
        name: 'HEX to Base64 Converter',
        description: 'Online tool for converting hexadecimal data to Base64 format',
        url: 'https://onlinewebdevtools.com/hex-to-base64'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }
  
  /**
   * Обновление темы редакторов Monaco
   */
  updateEditorTheme() {
    this.inputEditorOptions = {
      ...this.inputEditorOptions,
      theme: this.editorTheme
    };
    
    this.outputEditorOptions = {
      ...this.outputEditorOptions,
      theme: this.editorTheme
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
  handleEscapeKey(event: KeyboardEvent) {
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