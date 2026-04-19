import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostBinding,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';

import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { PageTitleService } from '../../services/page-title.service';
import { MetaData, SeoService } from '../../services/seo.service';
import { ThemeService } from '../../services/theme.service';
import {
  FileToHexSettings,
  UserPreferencesService,
} from '../../services/user-preferences.service';
import { IconsModule } from '../../shared/modules/icons.module';
import { PrimeNgModule } from '../../shared/modules/primeng.module';

@Component({
  selector: 'app-file-to-hex',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule,
    RouterModule,
  ],
  providers: [MessageService],
  templateUrl: './file-to-hex.component.html',
  styleUrl: './file-to-hex.component.scss',
})
export class FileToHexComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // File handling
  selectedFile: File | null = null;
  fileName: string = '';
  fileSize: number = 0;
  isDragOver: boolean = false;

  // HEX output
  hexOutput: string = '';
  rawHexOutput: string = ''; // Original hex before formatting

  // Browser check
  isBrowser: boolean = false;

  // URL текущей страницы для хранения настроек
  private pageUrl: string = 'file-to-hex';

  // HEX format options (same as base64-to-hex)
  hexFormatOptions: HexFormatOption[] = [
    {
      label: 'Plain',
      value: 'plain',
      description: 'Plain HEX (DEADBEEF)',
      formatter: (hex: string) => hex.toUpperCase(),
    },
    {
      label: 'With Dashes',
      value: 'dash',
      description: 'HEX with dashes (DE-AD-BE-EF)',
      formatter: (hex: string) => {
        const pairs = [];
        for (let i = 0; i < hex.length; i += 2) {
          pairs.push(hex.substr(i, 2));
        }
        return pairs.join('-').toUpperCase();
      },
    },
    {
      label: 'With 0x Prefix',
      value: 'prefix',
      description: 'HEX with 0x prefix (0xDE 0xAD 0xBE 0xEF)',
      formatter: (hex: string) => {
        const pairs = [];
        for (let i = 0; i < hex.length; i += 2) {
          pairs.push('0x' + hex.substr(i, 2));
        }
        return pairs.join(' ').toUpperCase();
      },
    },
    {
      label: 'With Colons',
      value: 'colon',
      description: 'HEX with colons (DE:AD:BE:EF)',
      formatter: (hex: string) => {
        const pairs = [];
        for (let i = 0; i < hex.length; i += 2) {
          pairs.push(hex.substr(i, 2));
        }
        return pairs.join(':').toUpperCase();
      },
    },
    {
      label: 'Lowercase',
      value: 'lowercase',
      description: 'Lowercase HEX (deadbeef)',
      formatter: (hex: string) => hex.toLowerCase(),
    },
    {
      label: 'With Spaces',
      value: 'spaces',
      description: 'HEX with spaces (DE AD BE EF)',
      formatter: (hex: string) => {
        const pairs = [];
        for (let i = 0; i < hex.length; i += 2) {
          pairs.push(hex.substr(i, 2));
        }
        return pairs.join(' ').toUpperCase();
      },
    },
  ];

  // Selected format
  selectedFormat: HexFormatOption = this.hexFormatOptions[0];

  // Menu items for "Use in"
  useHexInItems: MenuItem[] = [
    {
      label: 'HEX to File',
      icon: 'file-arrow-right',
      routerLink: '/hex-to-file',
    },
    {
      label: 'HEX to Base64',
      icon: 'transform',
      routerLink: '/hex-to-base64',
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
    this.pageTitleService.setTitle('File to HEX Converter');
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
      OgTitle: 'File to HEX Converter | DevTools',
      OgDescription:
        'Free online File to HEX converter. Convert any file to hexadecimal format instantly in your browser with no server upload.',
      description:
        'Free online File to HEX converter. Upload files via drag and drop or file picker, convert to hexadecimal format. Download or copy HEX result. Perfect for developers and data analysis.',
      keywords: [
        'file to hex',
        'hex encoder',
        'file converter',
        'convert file to hex',
        'hex encode',
        'file hex converter',
        'hexadecimal converter',
      ],
      jsonLd: {
        name: 'File to HEX Converter',
        description:
          'Free online tool for converting files to hexadecimal format',
        url: 'https://onlinewebdevtools.com/file-to-hex',
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
   * Process uploaded file and convert to HEX
   */
  private handleFile(file: File) {
    if (!this.isBrowser) return;

    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = file.size;

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);

      // Convert bytes to HEX string
      let hexString = '';
      for (let i = 0; i < bytes.length; i++) {
        const hex = bytes[i].toString(16);
        hexString += hex.padStart(2, '0');
      }

      this.rawHexOutput = hexString;

      // Apply selected format
      this.applyFormat();

      this.messageService.add({
        severity: 'success',
        summary: 'File Converted',
        detail: `File "${file.name}" converted to HEX successfully`,
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

    reader.readAsArrayBuffer(file);
  }

  /**
   * Load sample file (create a simple text file)
   */
  loadSample() {
    if (!this.isBrowser) return;

    const sampleText =
      'Hello, World!\nThis is a sample file for HEX conversion.';
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
    this.hexOutput = '';
    this.rawHexOutput = '';

    if (this.isBrowser && this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  /**
   * Copy HEX to clipboard
   */
  copyToClipboard() {
    if (!this.isBrowser || !this.hexOutput) return;

    navigator.clipboard
      .writeText(this.hexOutput)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied!',
          detail: 'HEX copied to clipboard',
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
   * Download HEX as text file
   */
  downloadHex() {
    if (!this.isBrowser || !this.hexOutput) return;

    try {
      const blob = new Blob([this.hexOutput], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.fileName ? `${this.fileName}.hex.txt` : 'hex.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: 'HEX file has been downloaded',
        life: 3000,
      });
    } catch (error) {
      console.error('Failed to download: ', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download HEX file',
        life: 3000,
      });
    }
  }

  /**
   * Send data to HEX to File or HEX to Base64 page
   */
  sendData(routerLink: string) {
    this.router.navigate([routerLink], {
      state: {
        data: this.hexOutput,
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
   * Apply selected format to hex output
   */
  applyFormat() {
    if (this.rawHexOutput) {
      this.hexOutput = this.selectedFormat.formatter(this.rawHexOutput);
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
      this.userPreferencesService.loadPageSettings<FileToHexSettings>(
        this.pageUrl
      );

    if (settings) {
      // If there's a saved format, find it in options and set it
      if (settings.selectedFormatValue) {
        const savedFormat = this.hexFormatOptions.find(
          (option) => option.value === settings.selectedFormatValue
        );
        if (savedFormat) {
          this.selectedFormat = savedFormat;
          // Apply format to existing hex if any
          if (this.rawHexOutput) {
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

    const settings: FileToHexSettings = {
      selectedFormatValue: this.selectedFormat.value,
    };

    this.userPreferencesService.savePageSettings(this.pageUrl, settings);
  }
}

// Interface for HEX format options
interface HexFormatOption {
  label: string;
  value: string;
  description: string;
  formatter: (hex: string) => string;
}

