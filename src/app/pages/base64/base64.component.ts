import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, Inject, PLATFORM_ID, Renderer2, effect } from '@angular/core';
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

// Services
import { PageTitleService } from '../../services/page-title.service';
import { ThemeService } from '../../services/theme.service';

// Directives
import { FavoritePageDirective } from '../../directives/favorite-page.directive';

// Monaco editor
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

@Component({
  selector: 'app-base64',
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
    MonacoEditorModule,
    FavoritePageDirective
  ],
  providers: [MessageService],
  templateUrl: './base64.component.html',
  styleUrl: './base64.component.scss'
})
export class Base64Component implements OnInit, AfterViewInit, OnDestroy {
  // Редакторы Monaco
  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  
  // Тема редактора
  editorTheme: string = 'vs';
  
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
  
  // Входные и выходные тексты
  inputCode: string = '';
  outputCode: string = '';
  
  // Режим работы (кодирование или декодирование)
  activeTab = 1; // По умолчанию - кодирование (encode)
  
  // Проверка окружения
  isBrowser: boolean;
  
  // Элемент схемы JSON-LD
  private schemaScriptElement: HTMLElement | null = null;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private titleService: Title,
    private metaService: Meta,
    private messageService: MessageService
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
    this.pageTitleService.setTitle('Base64 Encoder/Decoder');
    
    // Настройка SEO
    this.setupSeo();
    
    // Добавляем структурированные данные Schema.org для SEO
    this.addJsonLdToHead();
  }
  
  ngAfterViewInit() {
    // В AfterViewInit не требуется дополнительных действий
    // В данный момент редакторы уже должны быть созданы
  }
  
  ngOnDestroy() {
    // Удаляем элемент схемы при уничтожении компонента
    if (this.isBrowser && this.schemaScriptElement) {
      try {
        this.renderer.removeChild(this.document.head, this.schemaScriptElement);
      } catch (e) {
        console.error('Error removing JSON-LD script:', e);
      }
    }
  }
  
  /**
   * Настройка SEO для страницы
   */
  private setupSeo() {
    this.titleService.setTitle('Base64 Encoder and Decoder | DevTools');
    
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Free online Base64 encoder and decoder tool. Easily convert text to Base64 encoding or decode Base64 strings back to readable text. Perfect for data encoding needs, email attachments, and more.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'base64 encoder, base64 decoder, base64 converter, online base64 tool, text to base64, base64 to text' 
    });
    
    // Open Graph meta tags for better social sharing
    this.metaService.updateTag({ property: 'og:title', content: 'Base64 Encoder and Decoder | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Free online Base64 encoder and decoder. Convert text to Base64 or decode Base64 strings back to readable text. Includes copy and download features.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
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
    if (this.inputMonacoEditor?.editor) {
      this.inputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
    }
    
    if (this.outputMonacoEditor?.editor) {
      this.outputMonacoEditor.editor.updateOptions({ theme: this.editorTheme });
    }
  }
  
  /**
   * Добавление структурированных данных Schema.org для SEO
   */
  private addJsonLdToHead() {
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Base64 Encoder and Decoder',
      'applicationCategory': 'Utilities',
      'description': 'Online tool to encode and decode text to and from Base64 format',
      'operatingSystem': 'All',
      'url': 'https://onlinewebdevtools.com/base64'
    };

    const jsonLdContent = JSON.stringify(schemaData);
    
    try {
      const scriptElement = this.renderer.createElement('script');
      this.renderer.setAttribute(scriptElement, 'type', 'application/ld+json');
      this.renderer.setProperty(scriptElement, 'textContent', jsonLdContent);
      
      // Добавляем в head
      this.renderer.appendChild(this.document.head, scriptElement);
      
      // Сохраняем ссылку для последующего удаления
      this.schemaScriptElement = scriptElement;
    } catch (e) {
      console.error('Error adding JSON-LD script:', e);
    }
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