import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, Renderer2, ElementRef, HostListener, HostBinding } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { MonacoScrollFixDirective } from '../../shared/directives/monaco-scroll-fix.directive';
import { UserPreferencesService, Base64ToHexSettings } from '../../services/user-preferences.service';
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
    PageHeaderComponent,
    IconsModule,
    MonacoScrollFixDirective,
    AnchorHeadingDirective
  ],
  providers: [MessageService],
  templateUrl: './base64-to-hex.component.html',
  styleUrl: './base64-to-hex.component.scss'
})
export class Base64ToHexComponent implements OnInit, AfterViewInit, OnDestroy {
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
  
  // Настройки для редакторов
  inputEditorOptions: any;
  
  outputEditorOptions: any;
  
  isBrowser: boolean = false;
  
  // Полноэкранный режим
  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private messageService: MessageService,
    private router: Router,
    private userPreferencesService: UserPreferencesService,
    private seoService: SeoService,
    private monacoConfigService: MonacoConfigService
  ) {
    console.log('Base64ToHexComponent')
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
  }
  
  ngAfterViewInit() {
    // No initialization needed
  }
  
  ngOnDestroy() {
    // Очищаем SEO элементы
    this.seoService.destroy();
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
    const metaData: MetaData = {
      OgTitle: 'Base64 to HEX Converter | Free & Fast Online Tool – DevTools',
      OgDescription: 'Convert Base64 to HEX online for free. Fast, secure tool with customizable formatting: spacing, prefixes, case styles, and more.',
      description: 'Convert Base64 to HEX online for free. Fast, secure tool with customizable formatting: spacing, prefixes, case styles, and more.',
      keywords: ['base64 to hex', 'hex to base64', 'base64 converter', 'hex converter', 'encoding converter', 'base64 decode', 'hexadecimal converter', 'base64 to hex converter', 'hex to base64 converter'],
      jsonLd: {
        name: 'Base64 to HEX Converter',
        description: 'Convert Base64 to HEX online for free. Fast, secure tool with customizable formatting: spacing, prefixes, case styles, and more.',
        url: 'https://onlinewebdevtools.com/base64-to-hex'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }
  
  // Update editor settings when theme changes
  updateEditorTheme() {
    this.inputEditorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80,
      placeholder: 'Paste or type your Base64 encoded data here...\n\nExample:\nSGVsbG8gV29ybGQh'
    };
    this.outputEditorOptions = {
      ...this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80,
      placeholder: 'Converted HEX output will appear here...\n\nExample:\n48656c6c6f20576f726c6421'
    };
  }
  
  /**
   * Initialize editor options
   */
  private initializeEditorOptions() {
    this.inputEditorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80,
      placeholder: 'Paste or type your Base64 encoded data here...\n\nExample:\nSGVsbG8gV29ybGQh'
    };
    this.outputEditorOptions = {
      ...this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80,
      placeholder: 'Converted HEX output will appear here...\n\nExample:\n48656c6c6f20576f726c6421'
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