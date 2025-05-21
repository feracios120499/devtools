import { Component, OnInit, Inject, PLATFORM_ID, Renderer2, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { UserPreferencesService, PageSettings } from '../../services/user-preferences.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';

/**
 * Интерфейс для сохранения настроек страницы CSV Viewer
 */
export interface CsvViewerSettings extends PageSettings {
  delimiter: string;
  quoteChar: string;
  hasHeader: boolean;
}

/**
 * Интерфейс для опций разделителей
 */
interface DelimiterOption {
  label: string;
  value: string;
  description: string;
}

/**
 * Интерфейс для опций кавычек
 */
interface QuoteCharOption {
  label: string;
  value: string;
  description: string;
}

@Component({
  selector: 'app-csv-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    TableModule,
    PageHeaderComponent
  ],
  providers: [MessageService],
  templateUrl: './csv-viewer.component.html',
  styleUrl: './csv-viewer.component.scss'
})
export class CsvViewerComponent implements OnInit, OnDestroy {
  // Ссылка на таблицу для работы с фильтрацией
  @ViewChild('csvTable') csvTable!: Table;
  
  // Входные данные
  csvData: string = ''; // Отображаемый текст (возможно обрезанный)
  originalCsvData: string = ''; // Оригинальный текст (всегда полный)
  hiddenSymbolsCount: number = 0; // Количество скрытых символов
  maxDisplayLength: number = 1200; // Максимальная длина для отображения
  
  // Настройки парсинга CSV
  delimiterOptions: DelimiterOption[] = [
    { label: 'Comma (,)', value: ',', description: 'Standard CSV delimiter' },
    { label: 'Semicolon (;)', value: ';', description: 'Used in many European countries' },
    { label: 'Tab', value: '\t', description: 'Tab-separated values (TSV)' },
    { label: 'Pipe (|)', value: '|', description: 'Pipe-separated values' },
    { label: 'Space', value: ' ', description: 'Space-separated values' }
  ];
  selectedDelimiter: DelimiterOption = this.delimiterOptions[0];
  
  quoteCharOptions: QuoteCharOption[] = [
    { label: 'Double quotes (")', value: '"', description: 'Standard CSV quote character' },
    { label: 'Single quotes (\')', value: '\'', description: 'Alternative quote character' },
    { label: 'None', value: '', description: 'No quotes' }
  ];
  selectedQuoteChar: QuoteCharOption = this.quoteCharOptions[0];
  
  hasHeader: boolean = true;
  
  // Данные для таблицы
  parsedData: any[] = [];
  columns: any[] = [];
  filterFields: string[] = []; // Массив полей для глобальной фильтрации
  
  // Для MultiSelect выбора колонок
  selectedColumns: any[] = [];
  availableColumns: any[] = [];
  
  // Счётчики
  totalRows: number = 0;
  totalColumns: number = 0;
  
  // Флаг загрузки
  loading: boolean = false;
  
  // Состояние ошибки
  errorMessage: string | null = null;
  
  // Для SSR
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
    private userPreferencesService: UserPreferencesService,
    private seoService: SeoService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Устанавливаем заголовок страницы
    this.pageTitleService.setTitle('CSV Viewer');
    
    // Загружаем сохраненные настройки
    this.loadSavedSettings();
    
    // Настройка SEO
    this.setupSeo();
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
    // Очищаем SEO элементы
    this.seoService.destroy();
  }
  
  /**
   * Загружает сохраненные настройки из UserPreferencesService
   */
  private loadSavedSettings() {
    if (this.isBrowser) {
      const savedSettings = this.userPreferencesService.loadPageSettings<CsvViewerSettings>('/csv-viewer');
      
      if (savedSettings) {
        // Определяем разделитель
        const delimiterOption = this.delimiterOptions.find(opt => opt.value === savedSettings.delimiter);
        if (delimiterOption) {
          this.selectedDelimiter = delimiterOption;
        }
        
        // Определяем символ кавычек
        const quoteCharOption = this.quoteCharOptions.find(opt => opt.value === savedSettings.quoteChar);
        if (quoteCharOption) {
          this.selectedQuoteChar = quoteCharOption;
        }
        
        // Определяем наличие заголовка
        this.hasHeader = savedSettings.hasHeader;
      }
    }
  }
  
  /**
   * Сохраняет текущие настройки в UserPreferencesService
   */
  private saveSettings() {
    if (this.isBrowser) {
      const settings: CsvViewerSettings = {
        delimiter: this.selectedDelimiter.value,
        quoteChar: this.selectedQuoteChar.value,
        hasHeader: this.hasHeader
      };
      
      this.userPreferencesService.savePageSettings('/csv-viewer', settings);
    }
  }

  /**
   * Настройка SEO для страницы
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'CSV Viewer and Formatter | DevTools',
      OgDescription: 'Free online CSV viewer and formatter. View and explore CSV files in a convenient table format with sorting and filtering capabilities.',
      description: 'Free online CSV viewer and formatter tool. View and explore CSV files in a well-formatted table with pagination, sorting, and filtering capabilities. Configure delimiter, quote character, and display options for optimal visualization.',
      keywords: ['csv viewer', 'csv formatter', 'csv table viewer', 'csv parser', 'csv file viewer', 'online csv viewer', 'csv data viewer', 'csv explorer', 'csv file reader', 'open csv file online'],
      jsonLd: {
        name: 'CSV Viewer and Formatter',
        description: 'Online tool to view and format CSV data in a well-structured table',
        url: 'https://onlinewebdevtools.com/csv-viewer'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }
  
  /**
   * Обрабатывает изменение в настройках разделителя
   */
  onDelimiterChange() {
    this.saveSettings();
    this.parseCsvData();
  }
  
  /**
   * Обрабатывает изменение в настройках кавычек
   */
  onQuoteCharChange() {
    this.saveSettings();
    this.parseCsvData();
  }
  
  /**
   * Обрабатывает изменение настройки заголовка
   */
  onHeaderOptionChange() {
    this.saveSettings();
    this.parseCsvData();
  }
  
  /**
   * Обрабатывает изменение CSV данных из текстового поля
   */
  onCsvDataChange() {
    // Форматируем отображаемый текст
    this.formatDisplayText();
    
    // Затем вызываем парсинг данных
    this.parseCsvData();
  }
  
  /**
   * Форматирует текст для отображения, обрезая если нужно
   */
  private formatDisplayText() {
    if (this.originalCsvData.length <= this.maxDisplayLength) {
      this.csvData = this.originalCsvData;
      this.hiddenSymbolsCount = 0;
    } else {
      // Определяем количество скрытых символов
      this.hiddenSymbolsCount = this.originalCsvData.length - this.maxDisplayLength;
      
      // Берем первую часть (1/3 от допустимой длины)
      const firstPartLength = Math.floor(this.maxDisplayLength / 3);
      const firstPart = this.originalCsvData.substring(0, firstPartLength);
      
      // Берем последнюю часть (2/3 от допустимой длины для лучшей читаемости конца)
      const lastPartLength = Math.floor(this.maxDisplayLength * 2 / 3);
      const secondPart = this.originalCsvData.substring(this.originalCsvData.length - lastPartLength);
      
      // Формируем отображаемый текст
      this.csvData = `${firstPart}...${secondPart}`;
    }
  }
  
  /**
   * Очищает введенный текст и результаты
   */
  clearInput() {
    this.csvData = '';
    this.originalCsvData = '';
    this.hiddenSymbolsCount = 0;
    this.parsedData = [];
    this.columns = [];
    this.filterFields = [];
    this.selectedColumns = [];
    this.availableColumns = [];
    this.totalRows = 0;
    this.totalColumns = 0;
    this.errorMessage = null;
  }
  
  /**
   * Вставляет текст из буфера обмена
   */
  pasteFromClipboard() {
    if (!this.isBrowser) return;
    
    navigator.clipboard.readText().then(text => {
      this.originalCsvData = text;
      this.formatDisplayText();
      this.parseCsvData();
    }).catch(err => {
      console.error('Failed to read from clipboard:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to read from clipboard',
        life: 3000
      });
    });
  }
  
  /**
   * Загружает пример CSV данных
   */
  loadSampleCsv() {
    this.originalCsvData = `id,first_name,last_name,email,gender,ip_address
1,John,Doe,jdoe@example.com,Male,192.168.1.1
2,Jane,Smith,jsmith@example.com,Female,192.168.1.2
3,Robert,Johnson,rjohnson@example.com,Male,192.168.1.3
4,Emily,Williams,ewilliams@example.com,Female,192.168.1.4
5,Michael,Brown,mbrown@example.com,Male,192.168.1.5
6,Sarah,Jones,sjones@example.com,Female,192.168.1.6
7,David,Miller,dmiller@example.com,Male,192.168.1.7
8,Lisa,Wilson,lwilson@example.com,Female,192.168.1.8
9,James,Taylor,jtaylor@example.com,Male,192.168.1.9
10,Jennifer,Anderson,janderson@example.com,Female,192.168.1.10`;
    
    this.formatDisplayText();
    this.parseCsvData();
  }
  
  /**
   * Обрабатывает загрузку файла
   * @param event Событие загрузки файла
   */
  onFileUpload(event: any) {
    const file = event.files[0];
    if (!file) return;
    
    // Показываем индикатор загрузки
    this.loading = true;
    
    // Создаем читатель файла
    const reader = new FileReader();
    
    // Устанавливаем обработчик завершения
    reader.onload = () => {
      // Устанавливаем небольшую задержку, чтобы UI успел обновиться
      setTimeout(() => {
        this.originalCsvData = reader.result as string;
        this.formatDisplayText();
        this.parseCsvData();
        this.loading = false;
      }, 100);
    };
    
    // Устанавливаем обработчик ошибки
    reader.onerror = () => {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to read the file',
        life: 3000
      });
    };
    
    // Начинаем чтение файла как текст
    setTimeout(() => {
      reader.readAsText(file);
    }, 50);
  }
  
  /**
   * Анализирует и парсит CSV данные
   */
  parseCsvData() {
    if (!this.originalCsvData || !this.originalCsvData.trim()) {
      this.parsedData = [];
      this.columns = [];
      this.filterFields = [];
      this.selectedColumns = [];
      this.availableColumns = [];
      this.totalRows = 0;
      this.totalColumns = 0;
      this.errorMessage = null;
      return;
    }
    
    try {
      // Сбрасываем ошибку
      this.errorMessage = null;
      
      // Разделяем на строки
      const lines = this.originalCsvData.trim().split(/\r\n|\n|\r/);
      
      // Если нет строк, выходим
      if (lines.length === 0) {
        this.parsedData = [];
        this.columns = [];
        this.filterFields = [];
        this.selectedColumns = [];
        this.availableColumns = [];
        this.totalRows = 0;
        this.totalColumns = 0;
        return;
      }
      
      // Парсим с учетом кавычек и разделителей
      const parsedLines = this.parseLines(lines);
      
      // Если есть заголовок
      if (this.hasHeader && parsedLines.length > 0) {
        const headerRow = parsedLines[0];
        
        // Создаем колонки для таблицы PrimeNG
        this.columns = headerRow.map((header: string, index: number) => {
          return {
            field: header || `col${index}`, // Если заголовок пустой, используем col{index}
            header: header || `Column ${index + 1}`
          };
        });
        
        // Создаем массив полей для глобальной фильтрации
        this.filterFields = this.columns.map(col => col.field);
        
        // Создаем доступные колонки для multiselect
        this.availableColumns = [...this.columns];
        
        // По умолчанию выбираем все колонки
        this.selectedColumns = [...this.columns];
        
        // Преобразуем данные в массив объектов для таблицы PrimeNG
        this.parsedData = [];
        for (let i = 1; i < parsedLines.length; i++) {
          const row: any = {};
          
          // Для каждого значения в строке создаем свойство с именем заголовка
          for (let j = 0; j < headerRow.length; j++) {
            const columnName = headerRow[j] || `col${j}`;
            row[columnName] = j < parsedLines[i].length ? parsedLines[i][j] : '';
          }
          
          this.parsedData.push(row);
        }
      } else {
        // Без заголовка - создаем колонки с названиями Column 1, Column 2, ...
        if (parsedLines.length > 0) {
          const columnCount = Math.max(...parsedLines.map(row => row.length));
          
          this.columns = Array(columnCount).fill(0).map((_, index) => {
            return {
              field: `col${index}`,
              header: `Column ${index + 1}`
            };
          });
          
          // Создаем массив полей для глобальной фильтрации
          this.filterFields = this.columns.map(col => col.field);
          
          // Создаем доступные колонки для multiselect
          this.availableColumns = [...this.columns];
          
          // По умолчанию выбираем все колонки
          this.selectedColumns = [...this.columns];
          
          // Преобразуем данные в массив объектов для таблицы
          this.parsedData = parsedLines.map(row => {
            const rowObject: any = {};
            
            // Для каждого значения в строке создаем свойство col0, col1, ...
            for (let i = 0; i < columnCount; i++) {
              rowObject[`col${i}`] = i < row.length ? row[i] : '';
            }
            
            return rowObject;
          });
        } else {
          this.parsedData = [];
          this.columns = [];
          this.filterFields = [];
          this.selectedColumns = [];
          this.availableColumns = [];
        }
      }
      
      // Обновляем счетчики
      this.totalRows = this.parsedData.length;
      this.totalColumns = this.columns.length;
      
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      this.errorMessage = 'Failed to parse CSV data. Please check the format and try again.';
      
      // Очищаем данные при ошибке
      this.parsedData = [];
      this.columns = [];
      this.filterFields = [];
      this.selectedColumns = [];
      this.availableColumns = [];
      this.totalRows = 0;
      this.totalColumns = 0;
    }
  }
  
  /**
   * Парсит строки CSV с учетом кавычек
   */
  private parseLines(lines: string[]): string[][] {
    const delimiter = this.selectedDelimiter.value;
    const quoteChar = this.selectedQuoteChar.value;
    
    return lines.map(line => {
      const result: string[] = [];
      let currentValue = '';
      let insideQuotes = false;
      
      // Если не используются кавычки, просто разделяем по разделителю
      if (!quoteChar) {
        return line.split(delimiter);
      }
      
      // Проходим по каждому символу строки
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = i < line.length - 1 ? line[i + 1] : '';
        
        // Обработка кавычек
        if (char === quoteChar) {
          if (insideQuotes && nextChar === quoteChar) {
            // Экранированные кавычки внутри кавычек (например, "")
            currentValue += quoteChar;
            i++; // Пропускаем следующую кавычку
          } else {
            // Начало или конец кавычек
            insideQuotes = !insideQuotes;
          }
        } else if (char === delimiter && !insideQuotes) {
          // Разделитель вне кавычек - добавляем значение и начинаем новое
          result.push(currentValue);
          currentValue = '';
        } else {
          // Обычный символ
          currentValue += char;
        }
      }
      
      // Добавляем последнее значение
      result.push(currentValue);
      
      return result;
    });
  }
  
  /**
   * Очищает все фильтры в таблице
   */
  clearAllFilters() {
    this.csvTable.clear();
  }
  
  /**
   * Экспортирует данные в CSV файл
   */
  exportToCsv() {
    if (!this.parsedData || this.parsedData.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No data to export',
        life: 3000
      });
      return;
    }
    
    try {
      let csvContent = '';
      
      // Добавляем заголовки
      if (this.hasHeader) {
        csvContent += this.columns.map(column => this.quoteValue(column.header)).join(this.selectedDelimiter.value) + '\n';
      }
      
      // Добавляем строки данных
      this.parsedData.forEach(row => {
        const rowValues = this.columns.map(column => 
          this.quoteValue(row[column.field] !== undefined ? row[column.field] : '')
        );
        csvContent += rowValues.join(this.selectedDelimiter.value) + '\n';
      });
      
      // Создаем и загружаем файл
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Очищаем ресурсы
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'CSV file exported successfully',
        life: 3000
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'Failed to export CSV file',
        life: 3000
      });
    }
  }
  
  /**
   * Заключает значение в кавычки если необходимо
   */
  private quoteValue(value: any): string {
    const stringValue = String(value);
    const quoteChar = this.selectedQuoteChar.value || '"';
    const delimiter = this.selectedDelimiter.value;
    
    // Необходимо заключить в кавычки, если значение содержит разделитель или кавычки
    if (stringValue.includes(delimiter) || stringValue.includes(quoteChar)) {
      // Экранируем кавычки внутри значения
      const escapedValue = stringValue.replaceAll(quoteChar, quoteChar + quoteChar);
      return `${quoteChar}${escapedValue}${quoteChar}`;
    }
    
    return stringValue;
  }
  
  /**
   * Обрабатывает изменение выбранных колонок
   */
  onColumnSelectionChange() {
    // Если нет выбранных колонок, выбираем все доступные
    if (this.selectedColumns.length === 0) {
      this.selectedColumns = [...this.availableColumns];
    }
  }
} 