import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, Renderer2, HostBinding, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { FileTypeService, FileTypeInfo } from '../../services/file-type.service';
import { MimeTypeService, MimeTypeInfo } from '../../services/mime-type.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';
import { RouterModule } from '@angular/router';

// Интерфейс TypeOption совпадает с FileTypeInfo для использования с p-select
interface TypeOption extends FileTypeInfo {
  // Нет необходимости добавлять поле value, так как будем использовать исходные объекты
}

@Component({
  selector: 'app-hex-to-file',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    ToastModule,
    PageHeaderComponent,
    AnchorHeadingDirective,
    RouterModule
],
  providers: [MessageService],
  templateUrl: './hex-to-file.component.html',
  styleUrl: './hex-to-file.component.scss'
})
export class HexToFileComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  // Входные данные
  inputHex: string = '';
  displayHex: string = ''; // Отображаемый текст (возможно обрезанный)
  originalHex: string = ''; // Оригинальный текст (всегда полный)
  hiddenSymbolsCount: number = 0; // Количество скрытых символов
  maxDisplayLength: number = 1200; // Максимальная длина для отображения
  invalidHex: boolean = false; // Флаг для некорректного HEX
  
  fileName: string = '';
  detectedFileType: string | null = null;
  
  // Опции выбора типа файла
  typeOptions: TypeOption[] = [];
  selectedTypeOption: TypeOption | null = null;
  
  // Информация о MIME-типе
  mimeTypeInfo: MimeTypeInfo[] = [];
  
  // Для SEO
  isBrowser: boolean = false;

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
    public mimeTypeService: MimeTypeService,
    private seoService: SeoService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Устанавливаем заголовок страницы
    this.pageTitleService.setTitle('HEX to File Converter');
    
    // Настройка SEO
    this.setupSeo();
  }

  ngOnDestroy() {
    // Очищаем SEO-элементы при уничтожении компонента
    this.seoService.destroy();
  }

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/hex-to-file';
    const shortDescription = 'Free online HEX to File decoder. Convert hexadecimal strings back to downloadable binary files with automatic file type detection. 100% client-side, no upload.';

    const metaData: MetaData = {
      OgTitle: 'HEX to File Converter & Decoder Online | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'hex to file',
        'hex to file converter',
        'hex decoder',
        'hex to binary',
        'convert hex to file online',
        'download file from hex',
        'hex string to file',
        'decode hex online',
        'hex dump to file',
        'hex file reconstruction'
      ],
      jsonLd: {
        name: 'HEX to File Converter & Decoder Online | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Decode hexadecimal strings into downloadable binary files',
          'Support for plain, dashed, colon, space, and 0x-prefixed HEX formats',
          'Automatic file type detection via magic numbers (PNG, JPEG, PDF, ZIP, and more)',
          'Custom filename with editable extension',
          'MIME type suggestions for the detected format',
          'Real-time HEX validation with clear error messages',
          'Client-side processing for privacy and speed',
          'One-click sample data and clipboard paste'
        ]
      },
      faq: [
        {
          question: 'Is this HEX to File converter free to use?',
          answer: "Yes, it's completely free with no registration, ads, or usage limits."
        },
        {
          question: 'Do you upload my HEX data to a server?',
          answer: 'No, all decoding is done locally in your browser. Your HEX string and the resulting file never leave your device.'
        },
        {
          question: 'Which HEX formats are supported?',
          answer: 'Plain hex (DEADBEEF), dashed (DE-AD-BE-EF), colon-separated (DE:AD:BE:EF), space-separated (DE AD BE EF), and 0x-prefixed bytes are all accepted.'
        },
        {
          question: 'How is the file type detected?',
          answer: 'The decoder inspects the first bytes of your data (magic numbers / file signatures) and matches them against known formats such as PNG, JPEG, PDF, ZIP, MP4, and many others. If no match is found, the file is saved as a generic .bin file.'
        },
        {
          question: 'Can I override the detected file extension?',
          answer: 'Yes. You can edit the filename field and either pick a different type from the dropdown or type an explicit extension (for example report.pdf) before downloading.'
        },
        {
          question: 'Can I decode very large HEX strings?',
          answer: "Yes. The display is truncated for readability but the full input is always used when decoding. Practical limits depend on your browser's memory."
        },
        {
          question: 'What happens if my HEX is invalid?',
          answer: 'The tool validates the input in real time and shows a clear error if it contains non-hex characters or has an odd length. Fix the input and the decoder will re-enable the download.'
        }
      ],
      howTo: {
        name: 'How to decode HEX to a file online',
        description: 'Convert a hexadecimal string back into a downloadable binary file in three steps.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste HEX',
            text: 'Paste or type your hexadecimal string into the HEX input editor. Plain, dashed, colon, space, and 0x-prefixed formats are all accepted and validated in real time.',
            url: pageUrl + '#input'
          },
          {
            name: 'Configure filename',
            text: 'Review the auto-detected file type and adjust the filename or extension in the options section if you need a specific name or format.',
            url: pageUrl + '#options'
          },
          {
            name: 'Download file',
            text: 'Click Convert & Download to generate the decoded binary file with the correct MIME type and save it directly from your browser.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Encoding Tools', url: 'https://onlinewebdevtools.com/#encoding-tools' },
        { name: 'HEX to File', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }

  /**
   * Обрабатывает изменение hex строки в интерфейсе пользователя
   * @param value Новое значение hex строки
   */
  onInputChange(value: string) {
    // Сохраняем оригинальную строку
    this.originalHex = value;
    
    // Сбрасываем флаг ошибки
    this.invalidHex = false;
    
    // Проверяем, является ли строка корректным HEX
    if (value && !this.isValidHex(value)) {
      this.invalidHex = true;
      this.displayHex = value; // Показываем оригинал для исправления
      this.inputHex = value;
      
      // Сбрасываем информацию о типе файла
      this.detectedFileType = null;
      this.selectedTypeOption = null;
      this.typeOptions = [];
      this.mimeTypeInfo = [];
      return;
    }
    
    // Форматируем отображаемый текст
    this.formatDisplayText();
    
    // Вызываем обработку hex (определение типа файла и пр.)
    this.onHexChanged();
  }
  
  /**
   * Проверяет, является ли строка корректным HEX
   * @param str Строка для проверки
   * @returns true, если строка является корректным HEX
   */
  private isValidHex(str: string): boolean {
    if (!str || str.trim() === '') {
      return false;
    }
    
    // Нормализуем HEX строку, удаляя все разделители и префиксы
    let hexString = this.normalizeHexInput(str);
    
    // Проверка на пустую строку после нормализации
    if (!hexString) {
      return false;
    }
    
    // Проверяем с помощью регулярного выражения, что строка содержит только HEX символы
    const hexRegex = /^[0-9A-Fa-f]+$/;
    
    // Проверка на корректность HEX
    if (!hexRegex.test(hexString)) {
      return false;
    }
    
    // Проверка длины (должна быть четной для правильного представления байтов)
    if (hexString.length % 2 !== 0) {
      return false;
    }
    
    return true;
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
   * Форматирует текст для отображения, обрезая если нужно
   */
  formatDisplayText() {
    if (this.originalHex.length <= this.maxDisplayLength) {
      this.displayHex = this.originalHex;
      this.hiddenSymbolsCount = 0;
      this.inputHex = this.originalHex;
    } else {
      // Определяем количество скрытых символов
      this.hiddenSymbolsCount = this.originalHex.length - this.maxDisplayLength;
      
      // Берем первую часть (1/3 от допустимой длины)
      const firstPartLength = Math.floor(this.maxDisplayLength / 3);
      const firstPart = this.originalHex.substring(0, firstPartLength);
      
      // Берем последнюю часть (2/3 от допустимой длины для лучшей читаемости конца)
      const lastPartLength = Math.floor(this.maxDisplayLength * 2 / 3);
      const secondPart = this.originalHex.substring(this.originalHex.length - lastPartLength);
      
      // Формируем отображаемый текст - без вставки информации посередине
      this.displayHex = `${firstPart}...${secondPart}`;
      
      // Для работы компонента сохраняем оригинал в inputHex
      this.inputHex = this.originalHex;
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
   * Обработка ввода hex-строки
   */
  onHexChanged() {
    // Сбрасываем флаг ошибки
    this.invalidHex = false;
    
    if (this.inputHex) {
      try {
        // Нормализуем HEX строку
        const hexString = this.normalizeHexInput(this.inputHex);
        
        // Проверяем на корректность HEX
        if (!this.isValidHex(hexString)) {
          this.invalidHex = true;
          this.detectedFileType = null;
          this.selectedTypeOption = null;
          this.typeOptions = [];
          this.mimeTypeInfo = [];
          return;
        }
        
        // Преобразуем HEX в Base64 для определения типа файла
        const bytes = this.hexToBytes(hexString);
        const base64String = this.bytesToBase64(bytes);
        
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
        console.error('Error processing hex:', e);
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
   * Конвертация и скачивание файла из hex
   */
  convertAndDownload() {
    if (!this.inputHex || !this.isBrowser) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter a HEX string'
      });
      return;
    }
    
    // Проверяем на корректность HEX
    if (this.invalidHex) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid HEX string. Please check your input.'
      });
      return;
    }

    try {
      // Нормализуем HEX строку
      const hexString = this.normalizeHexInput(this.inputHex);
      
      // Проверяем на корректность HEX после нормализации
      if (!this.isValidHex(hexString)) {
        this.invalidHex = true;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid HEX string. Please check your input.'
        });
        return;
      }

      // Преобразуем HEX в бинарные данные
      const bytes = this.hexToBytes(hexString);

      // Получаем расширение файла и соответствующий MIME-тип
      let fileExtension = this.selectedTypeOption?.extension || this.detectedFileType;
      if (!fileExtension && this.fileName.includes('.')) {
        const parts = this.fileName.split('.');
        fileExtension = parts[parts.length - 1];
      }
      
      // Получаем MIME-тип для расширения
      const mimeType = this.mimeTypeService.getMimeTypeByExtension(fileExtension);

      // Создаем Blob для файла с правильным MIME-типом
      const blob = new Blob([bytes as BlobPart], { type: mimeType });

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
      console.error('Error converting hex to file:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid HEX string. Please check your input.'
      });
    }
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
    this.inputHex = '';
    this.displayHex = '';
    this.originalHex = '';
    this.hiddenSymbolsCount = 0;
    this.fileName = '';
    this.detectedFileType = null;
    this.selectedTypeOption = null;
    this.typeOptions = [];
    this.mimeTypeInfo = [];
    this.invalidHex = false;
  }

  /**
   * Вставка из буфера обмена
   */
  pasteFromClipboard() {
    if (this.isBrowser) {
      navigator.clipboard.readText()
        .then(text => {
          this.originalHex = text;
          this.formatDisplayText();
          this.onHexChanged();
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
    // Пример HEX строки для PNG изображения
    this.originalHex = '89504E470D0A1A0A0000000D49484452000000190000001908040000007BB927600000000467414D410000B18F0BFC6105000000097048597300000EC200000EC20115284A800000001A49444154189563601805A321301A02A321301A02A32130D210000051B40258F24B6D0000000049454E44AE426082';
    this.formatDisplayText();
    this.fileName = 'sample-image';
    this.onHexChanged();
  }

  /**
   * Получение текущей даты и времени для имени файла
   */
  private getCurrentDateTime(): string {
    const now = new Date();
    return `-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }
} 