import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, ElementRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MessageService } from 'primeng/api';
import { format } from 'sql-formatter';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { UserPreferencesService, SqlFormatterSettings } from '../../services/user-preferences.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';

// Interfaces for typing
interface IndentationOption {
  label: string;
  value: number;
}

interface LanguageOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-sql-formatter',
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
  templateUrl: './sql-formatter.component.html',
  styleUrl: './sql-formatter.component.scss'
})
export class SqlFormatterComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'dt-page';
  inputCode: string = '';
  outputCode: string = '';

  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;

  editorTheme: string = 'vs-dark'; // Default theme

  // Indentation options for the dropdown
  indentationOptions: IndentationOption[] = [
    { label: '2 Spaces', value: 2 },
    { label: '4 Spaces', value: 4 },
    { label: '1 Tab', value: 0 }
  ];

  // Default indentation selection
  selectedIndentation: IndentationOption = this.indentationOptions[0];

  // SQL language options
  languageOptions: LanguageOption[] = [
    { label: 'Standard SQL', value: 'sql' },
    { label: 'MySQL', value: 'mysql' },
    { label: 'PostgreSQL', value: 'postgresql' },
    { label: 'SQLite', value: 'sqlite' },
    { label: 'MariaDB', value: 'mariadb' },
    { label: 'BigQuery', value: 'bigquery' }
  ];

  // Default language selection
  selectedLanguage: LanguageOption = this.languageOptions[0];

  private readonly PAGE_URL = '/sql-formatter';

  inputEditorOptions = {
    theme: this.editorTheme,
    language: 'sql',
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
    language: 'sql',
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
  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private messageService: MessageService,
    private userPreferencesService: UserPreferencesService
  ) {
    // Set page title
    this.pageTitleService.setTitle('SQL Formatter and Beautifier');
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
    this.inputCode = '';
    this.setupSeo();
    this.loadUserPreferences();
  }

  // Handle ESC key press to exit fullscreen mode
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.isInputFullscreen || this.isOutputFullscreen) {
      // Exit fullscreen mode
      this.isInputFullscreen = false;
      this.isOutputFullscreen = false;
      
      // Update editor layout
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

  ngAfterViewInit() {
    // No initialization needed
  }

  ngOnDestroy() {
    this.seoService.destroy();
    this.saveUserPreferences();
  }

  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'SQL Formatter | DevTools',
      OgDescription: 'Format and beautify SQL queries with syntax highlighting, multiple database support, and customizable indentation.',
      description: 'Online SQL formatter and beautifier. Format SQL queries with proper indentation, syntax highlighting, and support for multiple database dialects including MySQL, PostgreSQL, SQLite.',
      keywords: ['SQL formatter', 'SQL beautifier', 'SQL syntax', 'MySQL formatter', 'PostgreSQL formatter', 'SQL query formatter', 'SQL code formatter', 'SQL pretty print', 'SQL indent', 'SQL format online', 'SQL code beautifier', 'SQL query beautifier', 'SQL formatting tool', 'SQL code formatting', 'SQLite formatter', 'SQL Server formatter', 'Oracle SQL formatter', 'format SQL online', 'beautify SQL online', 'SQL syntax highlighter'],
      jsonLd: {
        name: 'SQL Formatter - Format and Beautify SQL Queries',
        description: 'Free online SQL formatter tool to beautify and format SQL queries with syntax highlighting and multiple database dialect support.',
        url: 'https://onlinewebdevtools.com/sql-formatter'
      }
    };
    this.seoService.setupSeo(metaData);
  }

  /**
   * Load user preferences from localStorage
   */
  private loadUserPreferences() {
    const settings = this.userPreferencesService.loadPageSettings<SqlFormatterSettings>(this.PAGE_URL);
    
    if (settings) {
      // Restore language selection
      if (settings.selectedLanguage) {
        const language = this.languageOptions.find(lang => lang.value === settings.selectedLanguage);
        if (language) {
          this.selectedLanguage = language;
        }
      }
      
      // Restore indentation selection
      if (settings.selectedIndentation !== undefined) {
        const indentation = this.indentationOptions.find(ind => ind.value === settings.selectedIndentation);
        if (indentation) {
          this.selectedIndentation = indentation;
        }
      }
    }
  }

  /**
   * Save user preferences to localStorage
   */
  private saveUserPreferences() {
    const settings: SqlFormatterSettings = {
      selectedLanguage: this.selectedLanguage.value,
      selectedIndentation: this.selectedIndentation.value
    };
    
    this.userPreferencesService.savePageSettings(this.PAGE_URL, settings);
  }

  onIndentationChange() {
    this.formatSql();
    this.saveUserPreferences();
  }

  onLanguageChange() {
    this.formatSql();
    this.saveUserPreferences();
  }

  copyToClipboard() {
    if (navigator.clipboard && this.outputCode) {
      navigator.clipboard.writeText(this.outputCode).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied',
          detail: 'Formatted SQL copied to clipboard',
          life: 3000
        });
      }).catch(() => {
        // Fallback for older browsers
        this.fallbackCopyToClipboard();
      });
    } else {
      this.fallbackCopyToClipboard();
    }
  }

  private fallbackCopyToClipboard() {
    const textArea = document.createElement('textarea');
    textArea.value = this.outputCode;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Formatted SQL copied to clipboard',
        life: 3000
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard',
        life: 3000
      });
    }
    document.body.removeChild(textArea);
  }

  downloadSql() {
    const blob = new Blob([this.outputCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted_query.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Downloaded',
      detail: 'SQL file has been downloaded',
      life: 3000
    });
  }

  pasteFromClipboard() {
    if (navigator.clipboard) {
      navigator.clipboard.readText().then(text => {
        this.inputCode = text;
        this.formatSql();
        this.messageService.add({
          severity: 'success',
          summary: 'Pasted',
          detail: 'Content pasted from clipboard',
          life: 3000
        });
      }).catch(() => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Permission Denied',
          detail: 'Clipboard access not available. Please paste manually.',
          life: 3000
        });
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Not Supported',
        detail: 'Clipboard API not supported in this browser',
        life: 3000
      });
    }
  }

  loadSampleSql() {
    this.inputCode = `SELECT u.id, u.name, u.email, p.title, p.content, c.name AS category FROM users u LEFT JOIN posts p ON u.id = p.user_id INNER JOIN categories c ON p.category_id = c.id WHERE u.active = 1 AND p.published_at IS NOT NULL ORDER BY p.created_at DESC LIMIT 10;`;
    this.formatSql();
  }

  clearSql() {
    this.inputCode = '';
    this.outputCode = '';
  }

  updateEditorTheme() {
    if (this.isBrowser) {
      this.inputEditorOptions = { ...this.inputEditorOptions, theme: this.editorTheme };
      this.outputEditorOptions = { ...this.outputEditorOptions, theme: this.editorTheme };
    }
  }

  formatSql() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }

    try {
      const formatOptions: any = {
        language: this.selectedLanguage.value,
        tabWidth: this.selectedIndentation.value === 0 ? 1 : this.selectedIndentation.value,
        useTabs: this.selectedIndentation.value === 0,
        keywordCase: 'upper',
        linesBetweenQueries: 2
      };

      this.outputCode = format(this.inputCode, formatOptions);
    } catch (error) {
      this.outputCode = `-- Error formatting SQL:\n-- ${error}\n\n${this.inputCode}`;
    }
  }

  toggleFullscreen(editorType: 'input' | 'output') {
    if (editorType === 'input') {
      this.isInputFullscreen = !this.isInputFullscreen;
    } else {
      this.isOutputFullscreen = !this.isOutputFullscreen;
    }

    // Update editor layout after fullscreen toggle
    setTimeout(() => {
      if (editorType === 'input' && this.inputMonacoEditor?.editor) {
        this.inputMonacoEditor.editor.layout();
      } else if (editorType === 'output' && this.outputMonacoEditor?.editor) {
        this.outputMonacoEditor.editor.layout();
      }
    }, 100);
  }
} 