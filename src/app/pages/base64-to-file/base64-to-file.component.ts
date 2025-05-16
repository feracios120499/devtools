import { Component, OnInit, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { FavoritePageDirective } from '../../directives/favorite-page.directive';
import { FileTypeService, FileTypeInfo } from '../../services/file-type.service';
import { MimeTypeService, MimeTypeInfo } from '../../services/mime-type.service';

// Интерфейс TypeOption совпадает с FileTypeInfo для использования с p-select
interface TypeOption extends FileTypeInfo {
  // Нет необходимости добавлять поле value, так как будем использовать исходные объекты
}

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
  displayBase64: string = ''; // Отображаемый текст (возможно обрезанный)
  originalBase64: string = ''; // Оригинальный текст (всегда полный)
  hiddenSymbolsCount: number = 0; // Количество скрытых символов
  maxDisplayLength: number = 1200; // Максимальная длина для отображения
  invalidBase64: boolean = false; // Флаг для некорректного Base64
  
  fileName: string = '';
  detectedFileType: string | null = null;
  
  // Опции выбора типа файла
  typeOptions: TypeOption[] = [];
  selectedTypeOption: TypeOption | null = null;
  
  // Информация о MIME-типе
  mimeTypeInfo: MimeTypeInfo[] = [];
  
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
   * Обрабатывает изменение base64 строки в интерфейсе пользователя
   * @param value Новое значение base64 строки
   */
  onInputChange(value: string) {
    // Сохраняем оригинальную строку
    this.originalBase64 = value;
    
    // Сбрасываем флаг ошибки
    this.invalidBase64 = false;
    
    // Проверяем, является ли строка корректным Base64
    if (value && !this.isValidBase64(value)) {
      this.invalidBase64 = true;
      this.displayBase64 = value; // Показываем оригинал для исправления
      this.inputBase64 = value;
      
      // Сбрасываем информацию о типе файла
      this.detectedFileType = null;
      this.selectedTypeOption = null;
      this.typeOptions = [];
      this.mimeTypeInfo = [];
      return;
    }
    
    // Форматируем отображаемый текст
    this.formatDisplayText();
    
    // Вызываем обработку base64 (определение типа файла и пр.)
    this.onBase64Changed();
  }
  
  /**
   * Проверяет, является ли строка корректным Base64
   * @param str Строка для проверки
   * @returns true, если строка является корректным Base64
   */
  private isValidBase64(str: string): boolean {
    if (!str || str.trim() === '') {
      return false;
    }
    
    // Удаляем префикс data:*/*;base64, если он есть
    let testStr = str;
    if (str.includes('base64,')) {
      testStr = str.split('base64,')[1];
    }
    
    // Удаляем все пробелы и переносы строк
    testStr = testStr.replace(/[\s\r\n]+/g, '');
    
    // Ничего не осталось после удаления пробелов
    if (!testStr) {
      return false;
    }
    
    // Регулярка для проверки символов Base64
    // Допустимые символы: A-Z, a-z, 0-9, +, /, = (для паддинга)
    // А также - и _ для URL-безопасных вариантов Base64
    const base64Regex = /^[A-Za-z0-9+/\-_]*={0,2}$/;
    
    // Проверка соответствия формату Base64
    if (!base64Regex.test(testStr)) {
      return false;
    }
    
    // Дополнительная проверка: длина строки должна быть кратна 4 или почти кратна (для паддинга)
    const remainder = testStr.length % 4;
    if (remainder !== 0) {
      // Если строка не кратна 4, добавляем паддинг для проверки
      if (remainder === 1) {
        // Неверная длина, не может быть исправлена паддингом
        return false;
      }
      
      // Для URL-безопасного Base64, заменяем - на + и _ на / перед проверкой
      testStr = testStr.replace(/-/g, '+').replace(/_/g, '/');
      
      // Добавляем паддинг при необходимости
      while (testStr.length % 4 !== 0) {
        testStr += '=';
      }
    }
    
    // Пробуем декодировать строку
    try {
      atob(testStr);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Форматирует текст для отображения, обрезая если нужно
   */
  formatDisplayText() {
    if (this.originalBase64.length <= this.maxDisplayLength) {
      this.displayBase64 = this.originalBase64;
      this.hiddenSymbolsCount = 0;
      this.inputBase64 = this.originalBase64;
    } else {
      // Определяем количество скрытых символов
      this.hiddenSymbolsCount = this.originalBase64.length - this.maxDisplayLength;
      
      // Берем первую часть (1/3 от допустимой длины)
      const firstPartLength = Math.floor(this.maxDisplayLength / 3);
      const firstPart = this.originalBase64.substring(0, firstPartLength);
      
      // Берем последнюю часть (2/3 от допустимой длины для лучшей читаемости конца)
      const lastPartLength = Math.floor(this.maxDisplayLength * 2 / 3);
      const secondPart = this.originalBase64.substring(this.originalBase64.length - lastPartLength);
      
      // Формируем отображаемый текст - без вставки информации посередине
      this.displayBase64 = `${firstPart}...${secondPart}`;
      
      // Для работы компонента сохраняем оригинал в inputBase64
      this.inputBase64 = this.originalBase64;
    }
  }

  /**
   * Обработка выбора типа файла из выпадающего списка
   */
  onFileTypeChange() {
    console.log('onFileTypeChange', this.selectedTypeOption);
    
    if (this.selectedTypeOption) {
      this.detectedFileType = this.selectedTypeOption.extension;
      
      // Обновляем имя файла с новым расширением
      this.updateFileName(this.detectedFileType);
      
      // Получаем информацию о MIME-типах для выбранного расширения
      this.mimeTypeInfo = this.mimeTypeService.getMimeTypesForExtension(this.detectedFileType);
    } else {
      // Если выбор сброшен, устанавливаем тип по умолчанию
      if (this.typeOptions.length > 0) {
        this.selectedTypeOption = this.typeOptions[0];
        this.detectedFileType = this.selectedTypeOption.extension;
        this.mimeTypeInfo = this.mimeTypeService.getMimeTypesForExtension(this.detectedFileType);
        this.updateFileName(this.detectedFileType);
      }
    }
  }
  
  /**
   * Обновляет имя файла с учетом указанного расширения
   */
  private updateFileName(extension: string | null): void {
    console.log('updateFileName:', extension, 'current fileName:', this.fileName);
    
    if (!extension) return;
    
    // Если имя файла пустое, генерируем его
    if (!this.fileName || this.fileName.trim() === '') {
      this.fileName = `file${this.getCurrentDateTime()}.${extension}`;
      console.log('Generated fileName:', this.fileName);
      return;
    }
    
    // Если имя файла уже содержит расширение, заменяем его
    if (this.fileName.includes('.')) {
      const nameWithoutExt = this.fileName.split('.').slice(0, -1).join('.');
      this.fileName = `${nameWithoutExt}.${extension}`;
      console.log('Updated fileName with extension:', this.fileName);
    } else {
      // Если в имени файла нет расширения, добавляем его
      this.fileName = `${this.fileName}.${extension}`;
      console.log('Added extension to fileName:', this.fileName);
    }
  }

  /**
   * Обработка ввода base64-строки
   */
  onBase64Changed() {
    // Сбрасываем флаг ошибки
    this.invalidBase64 = false;
    
    if (this.inputBase64) {
      try {
        // Очищаем строку от префикса data:*/*;base64, если он есть
        let base64String = this.inputBase64;
        if (base64String.includes('base64,')) {
          base64String = base64String.split('base64,')[1];
        }
        
        // Проверяем на корректность Base64
        if (!this.isValidBase64(base64String)) {
          this.invalidBase64 = true;
          this.detectedFileType = null;
          this.selectedTypeOption = null;
          this.typeOptions = [];
          this.mimeTypeInfo = [];
          return;
        }
        
        // Получаем информацию о возможных типах файлов
        const fileTypeResult = this.fileTypeService.getFileTypes(base64String);
        console.log('fileTypeResult', JSON.stringify(fileTypeResult));
        
        // Очищаем предыдущие опции
        this.typeOptions = [];
        this.selectedTypeOption = null;
        
        // Создаем опции для выпадающего списка
        if (fileTypeResult.detectedTypes && fileTypeResult.detectedTypes.length > 0) {
          // Копируем объекты типов как есть, без создания новых объектов
          // Это обеспечит правильное отображение в выпадающем списке
          this.typeOptions = [...fileTypeResult.detectedTypes];
          
          // Выбираем тип по умолчанию
          if (fileTypeResult.defaultType) {
            // Находим объект в списке опций, соответствующий типу по умолчанию
            const defaultOption = this.typeOptions.find(
              option => option.extension === fileTypeResult.defaultType?.extension
            );
            
            if (defaultOption) {
              this.selectedTypeOption = defaultOption;
              this.detectedFileType = defaultOption.extension;
              console.log('Selected default option:', this.selectedTypeOption);
            }
            
            // Обновляем информацию о MIME-типах
            this.mimeTypeInfo = this.mimeTypeService.getMimeTypesForExtension(this.detectedFileType);
          } else if (this.typeOptions.length > 0) {
            // Если нет типа по умолчанию, выбираем первый элемент списка
            this.selectedTypeOption = this.typeOptions[0];
            this.detectedFileType = this.selectedTypeOption.extension;
            this.mimeTypeInfo = this.mimeTypeService.getMimeTypesForExtension(this.detectedFileType);
            console.log('Selected first option:', this.selectedTypeOption);
          } else {
            this.detectedFileType = null;
            this.selectedTypeOption = null;
            this.mimeTypeInfo = [];
          }
        }
        
        // Если не удалось определить тип файла, добавляем бинарный вариант
        if (this.typeOptions.length === 0) {
          const binOption = {
            extension: 'bin',
            description: 'Binary File',
            priority: 100
          };
          
          this.typeOptions.push(binOption);
          this.detectedFileType = 'bin';
          this.selectedTypeOption = binOption;
          this.mimeTypeInfo = this.mimeTypeService.getMimeTypesForExtension('bin');
          console.log('Added binary option:', this.selectedTypeOption);
        }
        
        // Обновляем имя файла с выбранным расширением
        this.updateFileName(this.detectedFileType);
        
      } catch (e) {
        console.error('Error processing base64:', e);
        this.detectedFileType = null;
        this.selectedTypeOption = null;
        this.typeOptions = [];
        this.mimeTypeInfo = [];
      }
    } else {
      this.detectedFileType = null;
      this.selectedTypeOption = null;
      this.typeOptions = [];
      this.mimeTypeInfo = [];
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
    
    // Проверяем на корректность Base64
    if (this.invalidBase64) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid Base64 string. Please check your input.'
      });
      return;
    }

    try {
      // Очищаем строку от префикса data:*/*;base64, если он есть
      let base64String = this.inputBase64;
      if (base64String.includes('base64,')) {
        base64String = base64String.split('base64,')[1];
      }

      // Пробуем декодировать base64
      try {
        atob(base64String);
      } catch (e) {
        this.invalidBase64 = true;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid Base64 string. Please check your input.'
        });
        return;
      }

      // Преобразуем Base64 в бинарные данные
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Получаем расширение файла и соответствующий MIME-тип
      let fileExtension = this.selectedTypeOption?.extension || this.detectedFileType;
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
        finalFileName = `file${this.getCurrentDateTime()}${fileExtension ? '.' + fileExtension : '.bin'}`;
      } else if (!finalFileName.includes('.')) {
        finalFileName += fileExtension ? '.' + fileExtension : '.bin';
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
    this.displayBase64 = '';
    this.originalBase64 = '';
    this.hiddenSymbolsCount = 0;
    this.fileName = '';
    this.detectedFileType = null;
    this.selectedTypeOption = null;
    this.typeOptions = [];
    this.mimeTypeInfo = [];
    this.invalidBase64 = false;
  }

  /**
   * Вставка из буфера обмена
   */
  pasteFromClipboard() {
    if (this.isBrowser) {
      navigator.clipboard.readText()
        .then(text => {
          this.originalBase64 = text;
          this.formatDisplayText();
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
    this.originalBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAgDIN8/9K2hgXS7SkKmqmpqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqampqamUdF8UyAS1Mn8k4AAAAAElFTkSuQmCC';
    this.formatDisplayText();
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