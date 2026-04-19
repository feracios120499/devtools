import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostBinding, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';

import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { PageTitleService } from '../../services/page-title.service';
import { MetaData, SeoService } from '../../services/seo.service';
import { ThemeService } from '../../services/theme.service';
import { FileToBase64Settings, UserPreferencesService } from '../../services/user-preferences.service';
import { IconsModule } from '../../shared/modules/icons.module';

@Component({
  selector: 'app-file-to-base64',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    IconsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    TextareaModule,
    TieredMenuModule,
    ToastModule,
    RippleModule,
  ],
  providers: [MessageService],
  templateUrl: './file-to-base64.component.html',
  styleUrl: './file-to-base64.component.scss',
})
export class FileToBase64Component implements OnInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // File handling
  selectedFile: File | null = null;
  fileName: string = '';
  fileSize: number = 0;
  isDragOver: boolean = false;

  // Base64 output
  base64Output: string = '';
  rawBase64Output: string = ''; // Original base64 before formatting

  // Browser check
  isBrowser: boolean = false;

  // URL текущей страницы для хранения настроек
  private pageUrl: string = 'file-to-base64';

  // Base64 format options
  base64FormatOptions: Base64FormatOption[] = [
    {
      label: 'Standard Base64',
      value: 'standard',
      description: 'Standard Base64 (A-Z, a-z, 0-9, +, /)',
      formatter: (base64: string) => base64,
    },
    {
      label: 'URL-Safe Base64',
      value: 'url-safe',
      description: 'URL-Safe Base64 (A-Z, a-z, 0-9, -, _)',
      formatter: (base64: string) => {
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      },
    },
    {
      label: 'With Line Breaks (76 chars)',
      value: 'line-breaks',
      description: 'Standard Base64 with line breaks every 76 characters',
      formatter: (base64: string) => {
        // Remove existing line breaks and whitespace
        const cleanBase64 = base64.replace(/\s+/g, '');
        // Insert line break every 76 characters
        return cleanBase64.match(/.{1,76}/g)?.join('\n') || cleanBase64;
      },
    },
  ];

  // Selected format
  selectedFormat: Base64FormatOption = this.base64FormatOptions[0];

  // Menu items for "Use in"
  useBase64InItems: MenuItem[] = [
    {
      label: 'Base64 to File',
      icon: 'download',
      routerLink: '/base64-to-file',
    },
    {
      label: 'Base64 to HEX',
      icon: 'exchange',
      routerLink: '/base64-to-hex',
    },
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private metaService: Meta,
    private titleService: Title,
    private messageService: MessageService,
    private router: Router,
    private seoService: SeoService,
    private userPreferencesService: UserPreferencesService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Получаем текущий URL для хранения настроек
    if (this.isBrowser) {
      this.pageUrl = this.router.url;
    }
  }

  ngOnInit() {
    this.pageTitleService.setTitle('File to Base64 Converter');
    this.setupSeo();

    // Загружаем сохраненные настройки
    this.loadUserPreferences();
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  /**
   * Setup SEO metadata
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'File to Base64 Converter | DevTools',
      OgDescription:
        'Free online File to Base64 converter. Convert any file to Base64 encoded string instantly in your browser with no server upload.',
      description:
        'Free online File to Base64 converter. Upload files via drag and drop or file picker, convert to Base64 encoded string. Download or copy Base64 result. Perfect for developers and data processing.',
      keywords: [
        'file to base64',
        'base64 encoder',
        'file converter',
        'convert file to base64',
        'base64 encode',
        'file base64 converter',
        'base64 string',
      ],
      jsonLd: {
        name: 'File to Base64 Converter',
        description:
          'Free online tool for converting files to Base64 encoded strings',
        url: 'https://onlinewebdevtools.com/file-to-base64',
      },
    };

    this.seoService.setupSeo(metaData);
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent) {
    if (!this.isBrowser) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent) {
    if (!this.isBrowser) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Handle drop event
   */
  onDrop(event: DragEvent) {
    if (!this.isBrowser) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  /**
   * Handle file input change
   */
  onFileSelected(event: Event) {
    if (!this.isBrowser) return;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  /**
   * Open file dialog
   */
  openFileDialog() {
    if (!this.isBrowser || !this.fileInputRef) return;
    this.fileInputRef.nativeElement.click();
  }

  /**
   * Process uploaded file and convert to Base64
   */
  private handleFile(file: File) {
    if (!this.isBrowser) return;

    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = file.size;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      if (result.includes('base64,')) {
        this.rawBase64Output = result.split('base64,')[1];
      } else {
        this.rawBase64Output = result;
      }

      // Apply selected format
      this.applyFormat();

      this.messageService.add({
        severity: 'success',
        summary: 'File Converted',
        detail: `File "${file.name}" converted to Base64 successfully`,
        life: 3000,
      });
    };

    reader.onerror = () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to read the file',
        life: 3000,
      });
    };

    reader.readAsDataURL(file);
  }

  /**
   * Load sample file (create a simple text file)
   */
  loadSample() {
    if (!this.isBrowser) return;

    const sampleText =
      'Hello, World!\nThis is a sample file for Base64 conversion.';
    const blob = new Blob([sampleText], { type: 'text/plain' });
    const file = new File([blob], 'sample.txt', { type: 'text/plain' });

    this.handleFile(file);
  }

  /**
   * Clear all data
   */
  clearInput() {
    this.selectedFile = null;
    this.fileName = '';
    this.fileSize = 0;
    this.base64Output = '';
    this.rawBase64Output = '';

    if (this.isBrowser && this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  /**
   * Copy Base64 to clipboard
   */
  copyToClipboard() {
    if (!this.isBrowser || !this.base64Output) return;

    navigator.clipboard
      .writeText(this.base64Output)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied!',
          detail: 'Base64 copied to clipboard',
          life: 3000,
        });
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy to clipboard',
          life: 3000,
        });
      });
  }

  /**
   * Download Base64 as text file
   */
  downloadBase64() {
    if (!this.isBrowser || !this.base64Output) return;

    try {
      const blob = new Blob([this.base64Output], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.fileName ? `${this.fileName}.base64.txt` : 'base64.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: 'Base64 file has been downloaded',
        life: 3000,
      });
    } catch (error) {
      console.error('Failed to download: ', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download Base64 file',
        life: 3000,
      });
    }
  }

  /**
   * Send data to Base64 to File page
   */
  sendData(routerLink: string) {
    this.router.navigate([routerLink], {
      state: {
        data: this.base64Output,
      },
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Apply selected format to base64 output
   */
  applyFormat() {
    if (this.rawBase64Output) {
      this.base64Output = this.selectedFormat.formatter(this.rawBase64Output);
    }
  }

  /**
   * Handle format change
   */
  onFormatChange() {
    this.applyFormat();
    this.saveUserPreferences();
  }

  /**
   * Load user preferences from localStorage
   */
  private loadUserPreferences() {
    if (!this.isBrowser) return;

    const settings =
      this.userPreferencesService.loadPageSettings<FileToBase64Settings>(
        this.pageUrl
      );

    if (settings) {
      // If there's a saved format, find it in options and set it
      if (settings.selectedFormatValue) {
        const savedFormat = this.base64FormatOptions.find(
          (option) => option.value === settings.selectedFormatValue
        );
        if (savedFormat) {
          this.selectedFormat = savedFormat;
          // Apply format to existing base64 if any
          if (this.rawBase64Output) {
            this.applyFormat();
          }
        }
      }
    }
  }

  /**
   * Save user preferences to localStorage
   */
  private saveUserPreferences() {
    if (!this.isBrowser) return;

    const settings: FileToBase64Settings = {
      selectedFormatValue: this.selectedFormat.value,
    };

    this.userPreferencesService.savePageSettings(this.pageUrl, settings);
  }
}

// Interface for Base64 format options
interface Base64FormatOption {
  label: string;
  value: string;
  description: string;
  formatter: (base64: string) => string;
}
