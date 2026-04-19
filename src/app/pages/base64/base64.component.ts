import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, Inject, PLATFORM_ID, Renderer2, effect, ElementRef, HostListener, HostBinding, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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

// Services
import { PageTitleService } from '../../services/page-title.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { ThemeService } from '../../services/theme.service';
import { SeoService, MetaData } from '../../services/seo.service';

// Monaco editor
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-base64',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TextareaModule,
    TooltipModule,
    ToastModule,
    RadioButtonModule,
    MonacoEditorLazyComponent,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule,
],
  providers: [MessageService],
  templateUrl: './base64.component.html',
  styleUrl: './base64.component.scss'
})
export class Base64Component implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  // Редакторы Monaco
  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;
  
  // Тема редактора
  editorTheme: string = 'vs';
  
  // Настройки для редакторов
  inputEditorOptions: any;
  
  outputEditorOptions: any;
  
  // Входные и выходные тексты
  inputCode: string = '';
  outputCode: string = '';
  
  // Режим работы (кодирование или декодирование)
  activeTab = 1; // По умолчанию - кодирование (encode)
  
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
  }

  ngOnInit() {
    // Устанавливаем заголовок страницы
    this.pageTitleService.setTitle('Base64 Encoder/Decoder');
    
    // Настройка SEO
    this.setupSeo();
  }
  
  ngAfterViewInit() {
    // В AfterViewInit не требуется дополнительных действий
    // В данный момент редакторы уже должны быть созданы
  }
  
  ngOnDestroy() {
    // Очищаем SEO-элементы при уничтожении компонента
    this.seoService.destroy();
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
  
  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/base64';
    const shortDescription = 'Free online Base64 encoder and decoder. Convert text to Base64 or decode Base64 back to readable text instantly in your browser. UTF-8 safe, no upload, copy and download included.';

    const metaData: MetaData = {
      OgTitle: 'Base64 Encoder and Decoder Online | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'base64 encoder',
        'base64 decoder',
        'base64 converter',
        'online base64 tool',
        'text to base64',
        'base64 to text',
        'encode base64',
        'decode base64',
        'base64 online',
        'utf-8 base64',
        'base64 encode decode',
        'base64 utility'
      ],
      jsonLd: {
        name: 'Base64 Encoder and Decoder Online | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Encode plain text to Base64',
          'Decode Base64 strings back to text',
          'UTF-8 safe handling of Unicode, emoji and CJK input',
          'One-click copy, paste and download',
          'Preloaded sample data for quick testing',
          'Monaco editor with fullscreen and word wrap',
          'Client-side processing for privacy'
        ]
      },
      faq: [
        {
          question: 'Why does a Base64 string sometimes end with one or two "=" characters?',
          answer: 'The = characters are padding. Base64 output length must be a multiple of 4, so when the input byte length is not a multiple of 3, one or two = are appended to indicate how many bytes were padded.'
        },
        {
          question: 'What is the difference between standard Base64 and URL-safe Base64?',
          answer: 'URL-safe Base64 (RFC 4648 §5) uses - and _ instead of + and / so the result can be used in URLs, filenames and JWTs without further percent-encoding.'
        },
        {
          question: 'Does this tool support Unicode text (emoji, Cyrillic, CJK)?',
          answer: 'Yes. The encoder UTF-8 encodes your text before calling btoa(), and the decoder reverses that, so arbitrary Unicode input works correctly.'
        },
        {
          question: 'Is there a maximum size I can encode or decode?',
          answer: "There is no hard limit set by the tool. Practical size is bounded by your browser's memory — strings of several megabytes are handled smoothly on modern machines."
        },
        {
          question: 'How is Base64 different from HEX encoding?',
          answer: 'Both represent binary data as text. HEX uses 16 characters and produces output that is 2× the input length; Base64 uses 64 characters and produces output that is ~1.33× the input length, making it more compact for transmission.'
        },
        {
          question: 'Is it safe to paste sensitive data here?',
          answer: 'All encoding/decoding happens locally in your browser — no data is sent to our servers. That said, Base64 is not encryption. Do not rely on Base64 to protect secrets; use proper cryptography for confidentiality.'
        },
        {
          question: 'Why do I sometimes get an error when decoding?',
          answer: 'Decoding fails when the input contains characters outside the Base64 alphabet, has incorrect padding, or mixes URL-safe and standard variants. Check that the string only contains A–Z a–z 0–9 + / = (or - _ for URL-safe).'
        }
      ],
      howTo: {
        name: 'How to encode and decode Base64 online',
        description: 'Convert between plain text and Base64 in your browser in three steps.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste text or Base64',
            text: 'Paste your plain text or Base64 string into the Input editor, or click the Sample button to load an example.',
            url: pageUrl + '#input'
          },
          {
            name: 'Toggle mode',
            text: 'Choose Encode from Text to Base64 or Decode from Base64 to Text using the mode toggle.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy or download',
            text: 'Copy the result to your clipboard or download it as a .txt file for later use.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Encoding Tools', url: 'https://onlinewebdevtools.com/#encoding-tools' },
        { name: 'Base64', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }
  
  /**
   * Обновление темы редакторов
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
    if (this.inputMonacoEditor?.editor) {
      this.inputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
    }
    
    if (this.outputMonacoEditor?.editor) {
      this.outputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
    }
  }
  
  /**
   * Инициализация настроек редакторов
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
   * Переключение режима (кодирование/декодирование)
   * Очищает поля ввода и вывода
   */
  switchMode() {
    // Очищаем поля ввода и вывода при переключении режима
    this.inputCode = '';
    this.outputCode = '';
  }
  
  /**
   * Процесс кодирования/декодирования текста
   */
  processText() {
    if (!this.inputCode || this.inputCode.trim() === '') {
      this.outputCode = '';
      return;
    }
    
    try {
      if (this.activeTab == 1) {
        // Декодирование Base64
        this.outputCode = this.decodeBase64(this.inputCode);
      } else {
        // Кодирование в Base64
        this.outputCode = this.encodeBase64(this.inputCode);
      }
    } catch (e) {
      console.error('Error processing text:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to process text. Please check your input.',
        life: 3000
      });
    }
  }
  
  /**
   * Кодирование текста в Base64
   */
  encodeBase64(text: string): string {
    if (!this.isBrowser) return '';
    
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
      console.error('Error encoding to Base64:', e);
      throw e;
    }
  }
  
  /**
   * Декодирование текста из Base64
   */
  decodeBase64(base64: string): string {
    if (!this.isBrowser) return '';
    
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      console.error('Error decoding from Base64:', e);
      throw e;
    }
  }
  
  /**
   * Копирование результата в буфер обмена
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
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard',
        life: 3000
      });
    });
  }
  
  /**
   * Вставка из буфера обмена
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
      console.error('Error pasting from clipboard:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to paste from clipboard',
        life: 3000
      });
    });
  }
  
  /**
   * Загрузка примера текста в зависимости от выбранного режима
   */
  loadSample() {
    if (this.activeTab == 1) {
      // Пример для декодирования - уже закодированная в Base64 строка
      this.inputCode = 'SGVsbG8sIHdvcmxkISBUaGlzIGlzIGEgQmFzZTY0IGVuY29kZWQgdGV4dC4=';
    } else {
      // Пример для кодирования - обычный текст
      this.inputCode = 'Hello, world! This is a sample text for Base64 encoding.';
    }
    
    // Обрабатываем пример
    this.processText();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Sample Loaded',
      detail: 'Sample text loaded for ' + (this.activeTab == 1 ? 'decoding' : 'encoding'),
      life: 3000
    });
  }
  
  /**
   * Очистка текста
   */
  clearText() {
    this.inputCode = '';
    this.outputCode = '';
    
    this.messageService.add({
      severity: 'info',
      summary: 'Cleared',
      detail: 'Text cleared',
      life: 3000
    });
  }
  
  /**
   * Скачивание результата в виде файла
   */
  downloadText() {
    if (!this.isBrowser || !this.outputCode) return;
    
    const blob = new Blob([this.outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = this.activeTab == 1 ? 'decoded_text.txt' : 'encoded_text.txt';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Downloaded',
      detail: 'Text downloaded as file',
      life: 3000
    });
  }
} 