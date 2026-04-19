import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, ElementRef, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { MessageService } from 'primeng/api';
import { format } from 'sql-formatter';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { UserPreferencesService, SqlFormatterSettings } from '../../services/user-preferences.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { RouterModule } from '@angular/router';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

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
    FormsModule,
    MonacoEditorLazyComponent,
    ButtonModule,
    SelectModule,
    ToastModule,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule,
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

  inputEditorOptions: any;
  outputEditorOptions: any;

  isBrowser: boolean = false;
  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private messageService: MessageService,
    private userPreferencesService: UserPreferencesService,
    private monacoConfigService: MonacoConfigService
  ) {
    // Set page title
    this.pageTitleService.setTitle('SQL Formatter and Beautifier');
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Initialize editor options
    this.inputEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'sql');
    this.outputEditorOptions = this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'sql');

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
  handleEscapeKey(event: Event) {
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

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/sql-formatter';
    const shortDescription = 'Format and beautify SQL queries online. Free in-browser SQL formatter with MySQL, PostgreSQL, Oracle and SQL Server support, configurable indentation and keyword case. No signup.';

    const metaData: MetaData = {
      OgTitle: 'SQL Formatter, Beautifier & Pretty Printer Online | DevTool',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'SQL formatter', 'SQL beautifier', 'format SQL online', 'beautify SQL online',
        'SQL pretty print', 'SQL query formatter', 'SQL code formatter', 'SQL indent',
        'MySQL formatter', 'PostgreSQL formatter', 'Oracle SQL formatter', 'SQL Server formatter',
        'SQLite formatter', 'MariaDB formatter', 'BigQuery formatter',
        'SQL syntax highlighter', 'online SQL tool', 'SQL query beautifier', 'clean SQL', 'SQL lint'
      ],
      jsonLd: {
        name: 'SQL Formatter, Beautifier & Pretty Printer Online | DevTool',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'SQL formatting with dialect-aware tokenizer (MySQL, PostgreSQL, SQLite, MariaDB, BigQuery)',
          'Upper-case keyword conversion for consistent readability',
          'Configurable indentation: 2 spaces, 4 spaces or tabs',
          'Monaco editor with syntax highlighting and full-screen mode',
          'Copy to clipboard and download as .sql file',
          'Client-side processing - queries never leave your browser'
        ]
      },
      faq: [
        {
          question: 'Is this SQL formatter free to use?',
          answer: 'Yes, it is completely free with no registration, ads or usage limits.'
        },
        {
          question: 'Do you store my SQL queries?',
          answer: 'No. All formatting happens locally in your browser - your queries never touch our servers.'
        },
        {
          question: 'Which SQL dialects are supported?',
          answer: 'You can format Standard SQL, MySQL, PostgreSQL, SQLite, MariaDB and BigQuery queries. Vendor-specific syntax from Oracle and SQL Server that follows ANSI SQL is also handled.'
        },
        {
          question: 'Does the tool change my query logic?',
          answer: 'No. The formatter only rewrites whitespace, indentation and keyword case. The tokens, identifiers and query semantics are preserved exactly as written.'
        },
        {
          question: 'Can I format very large SQL scripts?',
          answer: "Yes, the tool handles long multi-statement scripts efficiently. Performance is only limited by your browser's memory."
        },
        {
          question: 'Can I choose tabs instead of spaces?',
          answer: "Yes. Use the indentation dropdown to pick 2 spaces, 4 spaces or tabs to match your team's style guide."
        },
        {
          question: 'Does the formatter upper-case SQL keywords?',
          answer: 'Yes. Reserved keywords such as SELECT, FROM, WHERE and JOIN are automatically converted to upper case for consistency and readability.'
        }
      ],
      howTo: {
        name: 'How to format SQL queries online',
        description: 'Beautify SQL queries in your browser in three steps.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste your SQL',
            text: 'Paste your SQL query into the Input editor, or click the Sample button to load an example. The Monaco editor provides syntax highlighting as you type.',
            url: pageUrl + '#input'
          },
          {
            name: 'Pick dialect and indentation',
            text: 'Choose the SQL dialect (MySQL, PostgreSQL, SQLite, MariaDB or BigQuery) and an indent size (2 spaces, 4 spaces or tabs) from the options dropdowns.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy the formatted SQL',
            text: 'The formatted query appears in the Output editor. Copy it to your clipboard or download it as a .sql file.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Text Tools', url: 'https://onlinewebdevtools.com/#text-tools' },
        { name: 'SQL Formatter', url: pageUrl }
      ]
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
    this.inputEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'sql');
    this.outputEditorOptions = this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'sql');
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