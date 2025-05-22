import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, Inject, PLATFORM_ID, Renderer2, effect, ElementRef, HostListener, HostBinding } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

// Services
import { PageTitleService } from '../../services/page-title.service';
import { ThemeService } from '../../services/theme.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { UserPreferencesService, HexSettings } from '../../services/user-preferences.service';

// Monaco editor
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';

@Component({
  selector: 'app-hex',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TextareaModule,
    TooltipModule,
    ToastModule,
    RadioButtonModule,
    SelectModule,
    MonacoEditorModule,
    PageHeaderComponent,
    IconsModule
  ],
  providers: [MessageService],
  templateUrl: './hex.component.html',
  styleUrl: './hex.component.scss'
})
export class HexComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  // Редакторы Monaco
  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;
  
  // Тема редактора
  editorTheme: string = 'vs';
  
  // Плейсхолдер для редактора ввода
  inputEditorPlaceholder: string = 'Enter text to encode to HEX...';
  
  // Настройки для редакторов
  inputEditorOptions = {
    theme: this.editorTheme,
    language: 'plaintext',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    wordWrap: 'on',
    placeholder: this.inputEditorPlaceholder,
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
  
  // Входные и выходные тексты
  inputCode: string = '';
  outputCode: string = '';
  
  // Режим работы (кодирование или декодирование)
  activeTab = 1; // По умолчанию - кодирование (encode)
  
  // Форматы вывода HEX
  hexFormatOptions = [
    { label: 'Plain', value: 'plain', example: 'DEADBEEF' },
    { label: 'With Dashes', value: 'dashes', example: 'DE-AD-BE-EF' },
    { label: 'With 0x Prefix', value: '0x', example: '0xDE 0xAD 0xBE 0xEF' },
    { label: 'With Colons', value: 'colons', example: 'DE:AD:BE:EF' },
    { label: 'Lowercase', value: 'lowercase', example: 'deadbeef' },
    { label: 'With Spaces', value: 'spaces', example: 'DE AD BE EF' }
  ];
  
  // Выбранный формат вывода
  selectedFormat = this.hexFormatOptions[0];
  
  // URL страницы для сохранения настроек
  private pageUrl = 'hex';
  
  // Проверка окружения
  isBrowser: boolean;
  
  // Полноэкранный режим
  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private titleService: Title,
    private metaService: Meta,
    private messageService: MessageService,
    private seoService: SeoService,
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
  }

  ngOnInit() {
    // Устанавливаем заголовок страницы
    this.pageTitleService.setTitle('HEX Encoder/Decoder');
    
    // Загружаем сохраненные настройки
    this.loadUserPreferences();
    
    // Устанавливаем плейсхолдер в зависимости от режима
    this.updateInputPlaceholder();
    
    // Настройка SEO
    this.setupSeo();
  }
  
  ngAfterViewInit() {
    // В AfterViewInit редакторы уже должны быть созданы
    // Устанавливаем плейсхолдер с задержкой, чтобы убедиться что редактор инициализировался
    setTimeout(() => {
      this.setupMonacoEditor();
    }, 100);
  }
  
  /**
   * Настраивает редактор Monaco после его инициализации
   */
  setupMonacoEditor() {
    if (this.inputMonacoEditor?._editor) {
      // Прямой доступ к API Monaco для установки плейсхолдера
      // Это резервный метод, который гарантирует обновление плейсхолдера
      
      // Обновляем настройки редактора
      this.inputMonacoEditor._editor.updateOptions({
        placeholder: this.inputEditorPlaceholder
      });
      
      // Устанавливаем обработчик событий для редактора
      this.inputMonacoEditor._editor.onDidChangeModelContent(() => {
        this.processText();
      });
    }
  }
  
  ngOnDestroy() {
    // Очищаем SEO-элементы при уничтожении компонента
    this.seoService.destroy();
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
      if (editorType === 'input' && this.inputMonacoEditor?._editor) {
        this.inputMonacoEditor._editor.layout();
      } else if (editorType === 'output' && this.outputMonacoEditor?.editor) {
        this.outputMonacoEditor.editor.layout();
      }
    }, 100);
  }
  
  /**
   * Настройка SEO для страницы
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'HEX Encoder and Decoder | DevTools',
      OgDescription: 'Free online HEX encoder and decoder. Convert text to hexadecimal or decode HEX strings back to readable text. Includes copy and download features.',
      description: 'Free online HEX encoder and decoder tool. Easily convert text to hexadecimal encoding or decode HEX strings back to readable text. Perfect for data encoding, debugging and binary data analysis.',
      keywords: ['hex encoder', 'hex decoder', 'hexadecimal converter', 'online hex tool', 'text to hex', 'hex to text', 'binary to hex'],
      jsonLd: {
        name: 'HEX Encoder and Decoder',
        description: 'Online tool to encode and decode text to and from hexadecimal format',
        url: 'https://onlinewebdevtools.com/hex'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }
  
  /**
   * Загружает пользовательские настройки из localStorage
   */
  private loadUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings = this.userPreferencesService.loadPageSettings<HexSettings>(this.pageUrl);
    
    if (settings) {
      // Если есть сохраненный формат, находим его в опциях и устанавливаем
      if (settings.selectedFormatValue) {
        const savedFormat = this.hexFormatOptions.find(option => option.value === settings.selectedFormatValue);
        if (savedFormat) {
          this.selectedFormat = savedFormat;
        }
      }
      
      // Восстанавливаем активную вкладку
      if (settings.activeTab !== undefined) {
        this.activeTab = settings.activeTab;
      }
    }
  }
  
  /**
   * Сохраняет пользовательские настройки в localStorage
   */
  private saveUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings: HexSettings = {
      selectedFormatValue: this.selectedFormat.value,
      activeTab: this.activeTab
    };
    
    this.userPreferencesService.savePageSettings(this.pageUrl, settings);
  }
  
  /**
   * Обновление темы редакторов
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
    
    // Если редакторы уже созданы, обновляем их напрямую
    if (this.inputMonacoEditor?._editor) {
      this.inputMonacoEditor._editor.updateOptions({ theme: this.editorTheme });
    }
    
    if (this.outputMonacoEditor?.editor) {
      this.outputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
    }
  }
  
  /**
   * Переключение режима (кодирование/декодирование)
   * Очищает поля ввода и вывода
   */
  switchMode() {
    // Очищаем поля ввода и вывода
    this.inputCode = '';
    this.outputCode = '';
    
    // Обновляем плейсхолдер в зависимости от режима
    if (this.activeTab === 1) {
      this.inputEditorPlaceholder = 'Enter text to encode to HEX...';
    } else {
      this.inputEditorPlaceholder = 'Enter HEX to decode...\n\nSupported formats:\n' +
        '• Plain: DEADBEEF or deadbeef\n' +
        '• With Dashes: DE-AD-BE-EF\n' +
        '• With 0x Prefix: 0xDE 0xAD 0xBE 0xEF\n' +
        '• With Colons: DE:AD:BE:EF\n' +
        '• With Spaces: DE AD BE EF\n';
    }
    console.log(this.inputEditorPlaceholder);
    // Обновляем настройки редактора
    if (this.inputMonacoEditor?._editor) {
      this.inputMonacoEditor._editor.updateOptions({
        placeholder: this.inputEditorPlaceholder
      });
    }
    
    // Сохраняем настройки после переключения режима
    this.saveUserPreferences();
  }
  
  /**
   * Обновляет плейсхолдер в редакторе ввода в зависимости от выбранного режима
   */
  updateInputPlaceholder() {
    if (this.activeTab === 1) {
      // Режим кодирования текста в HEX
      this.inputEditorPlaceholder = 'Enter text to encode to HEX...';
    } else {
      // Режим декодирования HEX в текст
      this.inputEditorPlaceholder = 'Enter HEX to decode...\n\nSupported formats:\n' +
        '• Plain: DEADBEEF or deadbeef\n' +
        '• With Dashes: DE-AD-BE-EF\n' +
        '• With 0x Prefix: 0xDE 0xAD 0xBE 0xEF\n' +
        '• With Colons: DE:AD:BE:EF\n' +
        '• With Spaces: DE AD BE EF\n';
    }
    
    // Обновляем плейсхолдер в настройках компонента
    this.inputEditorOptions = {
      ...this.inputEditorOptions,
      placeholder: this.inputEditorPlaceholder
    };
    
    // Если редактор уже создан, обновляем его напрямую
    if (this.inputMonacoEditor?._editor) {
      try {
        // Пытаемся установить плейсхолдер через API Monaco
        const model = this.inputMonacoEditor._editor.getModel();
        if (model) {
          // Для Monaco 0.30.0 и выше можно использовать:
          // model.setAttachedData('placeholder', this.inputEditorPlaceholder);
          
          // Для более старых версий - прямое обновление опций:
          this.inputMonacoEditor._editor.updateOptions({
            placeholder: this.inputEditorPlaceholder
          });
        }
      } catch (error) {
        console.error('Error updating Monaco editor placeholder:', error);
      }
    }
  }
  
  /**
   * Обработка изменения формата вывода HEX
   */
  onFormatChange() {
    // Сохраняем выбранный формат
    this.saveUserPreferences();
    
    // Повторная обработка текста с новым форматом вывода
    this.processText();
  }
  
  /**
   * Обработка текста (в зависимости от выбранного режима)
   */
  processText() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }
    
    try {
      if (this.activeTab === 1) {
        // Режим: Текст в HEX
        this.outputCode = this.encodeHex(this.inputCode);
      } else {
        // Режим: HEX в текст
        this.outputCode = this.decodeHex(this.inputCode);
      }
    } catch (e) {
      // В случае ошибки показываем сообщение
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: e instanceof Error ? e.message : 'An error occurred',
        life: 3000
      });
    }
  }
  
  /**
   * Кодирование текста в HEX
   */
  encodeHex(text: string): string {
    let hex = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const hexValue = charCode.toString(16);
      // Добавляем ведущий ноль для значений < 16
      hex += hexValue.padStart(2, '0');
    }
    
    // Применяем выбранный формат
    return this.formatHex(hex);
  }
  
  /**
   * Форматирование HEX-строки согласно выбранному формату
   */
  formatHex(hex: string): string {
    // Преобразуем hex в верхний регистр для всех форматов кроме lowercase
    if (this.selectedFormat.value !== 'lowercase') {
      hex = hex.toUpperCase();
    }
    
    // Форматирование строки в зависимости от выбранного формата
    switch (this.selectedFormat.value) {
      case 'plain':
        return hex.toUpperCase();
      case 'dashes':
        return this.formatHexWithSeparator(hex, '-');
      case '0x':
        return this.formatHexWith0x(hex);
      case 'colons':
        return this.formatHexWithSeparator(hex, ':');
      case 'lowercase':
        return hex.toLowerCase();
      case 'spaces':
        return this.formatHexWithSeparator(hex, ' ');
      default:
        return hex.toUpperCase();
    }
  }
  
  /**
   * Форматирование HEX-строки с разделителем
   */
  formatHexWithSeparator(hex: string, separator: string): string {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(hex.substring(i, i + 2));
    }
    return bytes.join(separator);
  }
  
  /**
   * Форматирование HEX-строки с префиксом 0x
   */
  formatHexWith0x(hex: string): string {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push('0x' + hex.substring(i, i + 2));
    }
    return bytes.join(' ');
  }
  
  /**
   * Декодирование HEX в текст
   */
  decodeHex(hex: string): string {
    // Предварительная обработка входных данных
    hex = this.normalizeHexInput(hex);
    
    // Проверяем, что входные данные - валидный HEX
    if (!/^[0-9A-Fa-f]*$/.test(hex)) {
      throw new Error('Input contains non-hexadecimal characters');
    }
    
    // Если нечетное количество символов, добавляем 0 в начало
    if (hex.length % 2 !== 0) {
      hex = '0' + hex;
    }
    
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const hexByte = hex.substring(i, i + 2);
      const byte = parseInt(hexByte, 16);
      result += String.fromCharCode(byte);
    }
    return result;
  }
  
  /**
   * Нормализация HEX-строки для декодирования
   * Удаляет разделители, пробелы, переносы строк и префиксы 0x
   */
  normalizeHexInput(hex: string): string {
    // Удаляем пробелы, табуляции, переносы строк, тире, двоеточия
    hex = hex.replace(/[\s\n\r\-:]/g, '');
    
    // Удаляем префиксы 0x
    hex = hex.replace(/0x/gi, '');
    
    return hex;
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
        detail: 'Text copied to clipboard',
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
   * Вставка текста из буфера обмена
   */
  pasteFromClipboard() {
    if (!this.isBrowser) return;
    
    navigator.clipboard.readText().then((text) => {
      this.inputCode = text;
      this.processText();
      
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
   * Загрузка примера
   */
  loadSample() {
    if (this.activeTab === 1) {
      // Режим: Текст в HEX - загружаем текст
      this.inputCode = 'Hello, World! This is a sample text for HEX encoding.';
    } else {
      // Режим: HEX в текст - загружаем HEX
      // Выбираем пример в соответствии с текущим форматом
      switch (this.selectedFormat.value) {
        case 'dashes':
          this.inputCode = '48-65-6C-6C-6F-2C-20-57-6F-72-6C-64-21';
          break;
        case '0x':
          this.inputCode = '0x48 0x65 0x6C 0x6C 0x6F 0x2C 0x20 0x57 0x6F 0x72 0x6C 0x64 0x21';
          break;
        case 'colons':
          this.inputCode = '48:65:6C:6C:6F:2C:20:57:6F:72:6C:64:21';
          break;
        case 'lowercase':
          this.inputCode = '48656c6c6f2c20576f726c6421';
          break;
        case 'spaces':
          this.inputCode = '48 65 6C 6C 6F 2C 20 57 6F 72 6C 64 21';
          break;
        default:
          this.inputCode = '48656C6C6F2C20576F726C6421'; // Plain format
      }
    }
    this.processText();
  }
  
  /**
   * Очистка текста
   */
  clearText() {
    this.inputCode = '';
    this.outputCode = '';
  }
  
  /**
   * Скачивание результата
   */
  downloadText() {
    if (!this.isBrowser || !this.outputCode) return;
    
    const filename = this.activeTab === 1 ? 'encoded-hex.txt' : 'decoded-text.txt';
    const blob = new Blob([this.outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Downloaded!',
      detail: `File ${filename} has been downloaded`,
      life: 3000
    });
  }
} 