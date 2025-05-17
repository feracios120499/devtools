import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { FavoritePageDirective } from '../../directives/favorite-page.directive';
import { UserPreferencesService, Base64ToHexSettings } from '../../services/user-preferences.service';

// Only declare Monaco type for type checking, don't use directly
// It will be accessed dynamically only in browser context
interface Monaco {
  editor: any;
  languages: any;
}

// Интерфейс для опций форматирования hex
interface HexFormatOption {
  label: string;
  value: string;
  example: string;
  formatter: (hex: string) => string;
}

@Component({
  selector: 'app-base64-to-hex',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MonacoEditorModule,
    PrimeNgModule,
    FavoritePageDirective
  ],
  providers: [MessageService],
  templateUrl: './base64-to-hex.component.html',
  styleUrl: './base64-to-hex.component.scss'
})
export class Base64ToHexComponent implements OnInit, AfterViewInit, OnDestroy {
  inputCode: string = '';
  outputCode: string = '';
  
  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  
  editorTheme: string = 'vs-dark'; // Default theme
  
  // URL текущей страницы для хранения настроек
  private pageUrl: string = 'base64-to-hex';
  
  // Опции форматирования hex
  hexFormatOptions: HexFormatOption[] = [
    { 
      label: 'Plain', 
      value: 'plain', 
      example: 'DEADBEEF',
      formatter: (hex: string) => hex.toUpperCase() 
    },
    { 
      label: 'With Dashes', 
      value: 'dash', 
      example: 'DE-AD-BE-EF',
      formatter: (hex: string) => {
        const pairs = [];
        for (let i = 0; i < hex.length; i += 2) {
          pairs.push(hex.substr(i, 2));
        }
        return pairs.join('-').toUpperCase();
      }
    },
    { 
      label: 'With 0x Prefix', 
      value: 'prefix', 
      example: '0xDE 0xAD 0xBE 0xEF',
      formatter: (hex: string) => {
        const pairs = [];
        for (let i = 0; i < hex.length; i += 2) {
          pairs.push('0x' + hex.substr(i, 2));
        }
        return pairs.join(' ').toUpperCase();
      }
    },
    { 
      label: 'With Colons', 
      value: 'colon', 
      example: 'DE:AD:BE:EF',
      formatter: (hex: string) => {
        const pairs = [];
        for (let i = 0; i < hex.length; i += 2) {
          pairs.push(hex.substr(i, 2));
        }
        return pairs.join(':').toUpperCase();
      }
    },
    { 
      label: 'Lowercase', 
      value: 'lowercase', 
      example: 'deadbeef',
      formatter: (hex: string) => hex.toLowerCase() 
    },
    { 
      label: 'With Spaces', 
      value: 'spaces', 
      example: 'DE AD BE EF',
      formatter: (hex: string) => {
        const pairs = [];
        for (let i = 0; i < hex.length; i += 2) {
          pairs.push(hex.substr(i, 2));
        }
        return pairs.join(' ').toUpperCase();
      }
    }
  ];
  
  // Default format selection
  selectedFormat: HexFormatOption = this.hexFormatOptions[0];
  
  // Для SSR и манипуляций с DOM
  private schemaScriptElement: HTMLElement | null = null;
  
  inputEditorOptions = {
    theme: this.editorTheme,
    language: 'plaintext',
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
    private userPreferencesService: UserPreferencesService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // React to theme changes in the application, only in browser
    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }
    
    // Получаем текущий URL для хранения настроек
    if (this.isBrowser) {
      this.pageUrl = this.router.url;
    }
    
    // Set page title
    this.pageTitleService.setTitle('Base64 to HEX Converter');
  }
  
  ngOnInit() {
    // Start with empty input
    this.inputCode = '';
    
    // Загружаем сохраненные настройки
    this.loadUserPreferences();
    
    // SEO setup
    this.setupSeo();
    
    // Добавить JSON-LD в head
    this.addJsonLdToHead();
  }
  
  ngAfterViewInit() {
    // No initialization needed
  }
  
  ngOnDestroy() {
    // Удаляем элемент при уничтожении компонента, только в браузере
    if (this.isBrowser && this.schemaScriptElement) {
      try {
        this.renderer.removeChild(this.document.head, this.schemaScriptElement);
      } catch (e) {
        console.error('Error removing JSON-LD script:', e);
      }
    }
  }
  
  /**
   * Загружает пользовательские настройки из localStorage
   */
  private loadUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings = this.userPreferencesService.loadPageSettings<Base64ToHexSettings>(this.pageUrl);
    
    if (settings) {
      // Если есть сохраненный формат, находим его в опциях и устанавливаем
      if (settings.selectedFormatValue) {
        const savedFormat = this.hexFormatOptions.find(option => option.value === settings.selectedFormatValue);
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
    
    const settings: Base64ToHexSettings = {
      selectedFormatValue: this.selectedFormat.value
    };
    
    this.userPreferencesService.savePageSettings(this.pageUrl, settings);
  }
  
  /**
   * Добавляет JSON-LD скрипт в head документа
   */
  private addJsonLdToHead() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Base64 to HEX Converter",
      "description": "Free online tool for converting Base64 data to hexadecimal format with various formatting options",
      "applicationCategory": "Utilities",
      "operatingSystem": "All",
      "url": "https://onlinewebdevtools.com/base64-to-hex"
    };
    
    const jsonLdContent = JSON.stringify(schema);
    
    // Добавляем скрипт в head с помощью Renderer2
    try {
      const scriptElement = this.renderer.createElement('script');
      this.renderer.setAttribute(scriptElement, 'type', 'application/ld+json');
      this.renderer.setProperty(scriptElement, 'textContent', jsonLdContent);
      
      // Добавляем в head
      this.renderer.appendChild(this.document.head, scriptElement);
      
      // Сохраняем ссылку для последующего удаления
      this.schemaScriptElement = scriptElement;
    } catch (e) {
      console.error('Error adding JSON-LD script using Renderer2:', e);
    }
  }
  
  /**
   * Handles format option change
   */
  onFormatChange() {
    // Сохраняем выбранный формат
    this.saveUserPreferences();
    
    // Повторная конвертация с новым форматом вывода
    this.convertBase64ToHex();
  }
  
  /**
   * Copy formatted HEX to clipboard
   */
  copyToClipboard() {
    if (!this.isBrowser || !this.outputCode) return;
    
    navigator.clipboard.writeText(this.outputCode).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: 'HEX copied to clipboard',
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
   * Download HEX as a file
   */
  downloadHex() {
    if (!this.isBrowser || !this.outputCode) return;
    
    try {
      const blob = new Blob([this.outputCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted.hex';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: 'HEX file has been downloaded',
        life: 3000
      });
    } catch (error) {
      console.error('Failed to download: ', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download HEX file',
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
      this.convertBase64ToHex();
      
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
   * Load sample Base64 data
   */
  loadSampleBase64() {
    this.inputCode = 'SGVsbG8gV29ybGQh'; // "Hello World!" в Base64
    this.convertBase64ToHex();
  }
  
  /**
   * Clear all input
   */
  clearInput() {
    this.inputCode = '';
    this.outputCode = '';
  }
  
  /**
   * Перезагружает страницу
   */
  reloadPage() {
    if (this.isBrowser) {
      window.location.reload();
    }
  }
  
  // Setup metadata for SEO
  private setupSeo() {
    // We don't need to set the title here anymore as it's handled by PageTitleService
    
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Free online Base64 to HEX converter tool. Convert Base64 encoded data to hexadecimal format with various formatting options including plain, spaced, prefixed (0x), colon-separated, and more.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'Base64 to HEX, Base64 converter, hex converter, hex formatting, binary conversion, online converter' 
    });
    
    // Open Graph meta tags for better social sharing
    this.metaService.updateTag({ property: 'og:title', content: 'Base64 to HEX Converter | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Free online Base64 to HEX converter tool. Convert Base64 encoded data to hexadecimal format with various formatting options.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
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
   * Converts Base64 input to hexadecimal
   */
  convertBase64ToHex() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }
    
    try {
      // Декодируем Base64 в бинарные данные
      const binaryString = atob(this.inputCode.trim());
      
      // Преобразуем бинарные данные в шестнадцатеричный формат
      let hexString = '';
      for (let i = 0; i < binaryString.length; i++) {
        // Получаем шестнадцатеричное представление символа и добавляем ведущий ноль, если нужно
        const hex = binaryString.charCodeAt(i).toString(16).padStart(2, '0');
        hexString += hex;
      }
      
      // Применяем выбранный формат
      this.outputCode = this.selectedFormat.formatter(hexString);
      
      // Clear any previous error messages
      this.messageService.clear();
    } catch (e) {
      console.error('Base64 conversion error:', e);
      
      // Show error in the UI
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Base64',
        detail: e instanceof Error ? e.message : 'The input is not valid Base64',
        life: 5000
      });
      
      this.outputCode = 'Error: Invalid Base64 input';
    }
  }
} 