import { Component, OnInit, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { FavoritePageDirective } from '../../directives/favorite-page.directive';
import { FileTypeService } from '../../services/file-type.service';
import { MimeTypeService } from '../../services/mime-type.service';

@Component({
  selector: 'app-base64-to-file',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    FavoritePageDirective
  ],
  providers: [MessageService],
  templateUrl: './base64-to-file.component.html',
  styleUrl: './base64-to-file.component.scss'
})
export class Base64ToFileComponent implements OnInit {
  // Входные данные
  inputBase64: string = '';
  fileName: string = '';
  detectedFileType: string | null = null;
  
  // Для SEO
  isBrowser: boolean = false;
  private schemaScriptElement: HTMLElement | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private metaService: Meta,
    private titleService: Title,
    private messageService: MessageService,
    private fileTypeService: FileTypeService,
    public mimeTypeService: MimeTypeService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Устанавливаем заголовок страницы
    this.pageTitleService.setTitle('Base64 to File Converter');
    
    // Настройка SEO
    this.setupSeo();
    
    // Добавляем структурированные данные Schema.org для SEO
    this.addJsonLdToHead();
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
    this.titleService.setTitle('Base64 to File Converter | DevTools');
    
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Free online Base64 to File converter. Convert Base64 encoded data back to files. Download files from Base64 strings with automatic file type detection. Perfect for developers and data processing.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'base64 to file, base64 decoder, base64 converter, convert base64 to file, download file from base64, base64 file converter, base64 to binary' 
    });
    
    // Open Graph meta tags for better social sharing
    this.metaService.updateTag({ property: 'og:title', content: 'Base64 to File Converter | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Free online Base64 to File converter. Convert Base64 encoded data back to downloadable files with automatic file type detection.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
  }
  
  /**
   * Добавление JSON-LD для SEO
   */
  private addJsonLdToHead() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Base64 to File Converter",
      "description": "Free online tool for converting Base64 encoded data to downloadable files",
      "applicationCategory": "Utilities",
      "operatingSystem": "All",
      "url": "https://onlinewebdevtools.com/base64-to-file"
    };
    
    const jsonLdContent = JSON.stringify(schema);
    
    try {
      const scriptElement = this.renderer.createElement('script');
      this.renderer.setAttribute(scriptElement, 'type', 'application/ld+json');
      this.renderer.setProperty(scriptElement, 'textContent', jsonLdContent);
      
      // Add to head
      this.renderer.appendChild(this.document.head, scriptElement);
      
      // Save reference for later removal
      this.schemaScriptElement = scriptElement;
    } catch (e) {
      console.error('Error adding JSON-LD script:', e);
    }
  }

  /**
   * Обработка ввода base64-строки
   */
  onBase64Changed() {
    if (this.inputBase64) {
      try {
        // Очищаем строку от префикса data:*/*;base64, если он есть
        let base64String = this.inputBase64;
        if (base64String.includes('base64,')) {
          base64String = base64String.split('base64,')[1];
        }
        
        // Определяем тип файла
        this.detectedFileType = this.fileTypeService.getFileExtension(base64String);
        
        // Если имя файла пустое, генерируем его
        if (!this.fileName) {
          this.fileName = `file${this.getCurrentDateTime()}${this.detectedFileType ? '.' + this.detectedFileType : '.bin'}`;
        } else if (!this.fileName.includes('.')) {
          // Если в имени файла нет расширения, добавляем его
          this.fileName += this.detectedFileType ? '.' + this.detectedFileType : '.bin';
        }
      } catch (e) {
        console.error('Error processing base64:', e);
        this.detectedFileType = null;
      }
    } else {
      this.detectedFileType = null;
    }
  }

  /**
   * Конвертация и скачивание файла из base64
   */
  convertAndDownload() {
    if (!this.inputBase64 || !this.isBrowser) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter a Base64 string'
      });
      return;
    }

    try {
      // Очищаем строку от префикса data:*/*;base64, если он есть
      let base64String = this.inputBase64;
      if (base64String.includes('base64,')) {
        base64String = base64String.split('base64,')[1];
      }

      // Преобразуем Base64 в бинарные данные
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Получаем расширение файла и соответствующий MIME-тип
      let fileExtension = this.detectedFileType;
      if (!fileExtension && this.fileName.includes('.')) {
        const parts = this.fileName.split('.');
        fileExtension = parts[parts.length - 1];
      }
      
      // Получаем MIME-тип для расширения
      const mimeType = this.mimeTypeService.getMimeTypeByExtension(fileExtension);

      // Создаем Blob для файла с правильным MIME-типом
      const blob = new Blob([bytes], { type: mimeType });

      // Проверяем имя файла и добавляем расширение, если его нет
      let finalFileName = this.fileName;
      if (!finalFileName) {
        finalFileName = `file${this.getCurrentDateTime()}${this.detectedFileType ? '.' + this.detectedFileType : '.bin'}`;
      } else if (!finalFileName.includes('.')) {
        finalFileName += this.detectedFileType ? '.' + this.detectedFileType : '.bin';
      }

      // Безопасное скачивание файла
      this.downloadFile(blob, finalFileName);
    } catch (e) {
      console.error('Error converting base64 to file:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid Base64 string. Please check your input.'
      });
    }
  }

  /**
   * Безопасное скачивание файла
   */
  private downloadFile(blob: Blob, fileName: string) {
    try {
      const url = URL.createObjectURL(blob);
      const a = this.renderer.createElement('a');
      a.href = url;
      a.download = fileName;
      
      // Добавляем элемент в DOM, вызываем клик и удаляем
      this.renderer.appendChild(this.document.body, a);
      a.click();
      //this.renderer.removeChild(this.document.body, a);
      
      // // Очищаем ресурсы
      // setTimeout(() => {
      //   URL.revokeObjectURL(url);
      // }, 100);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `File "${fileName}" downloaded successfully`
      });
    } catch (err) {
      console.error('Error downloading file:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download file'
      });
    }
  }

  /**
   * Очистка ввода
   */
  clearInput() {
    this.inputBase64 = '';
    this.fileName = '';
    this.detectedFileType = null;
  }

  /**
   * Вставка из буфера обмена
   */
  pasteFromClipboard() {
    if (this.isBrowser) {
      navigator.clipboard.readText()
        .then(text => {
          this.inputBase64 = text;
          this.onBase64Changed();
        })
        .catch(err => {
          console.error('Failed to read clipboard contents: ', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to paste from clipboard. Please check permissions.'
          });
        });
    }
  }

  /**
   * Загрузка примера
   */
  loadSample() {
    // Пример Base64 PNG изображения
    this.inputBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAgDIN8/9K2hgXS7SkKmqmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqamUdF8UyAS1Mn8k4AAAAAElFTkSuQmCC';
    this.fileName = 'sample-image';
    this.onBase64Changed();
  }

  /**
   * Получение текущей даты и времени для имени файла
   */
  private getCurrentDateTime(): string {
    const now = new Date();
    return `-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }
} 