import { Component, OnInit, Inject, PLATFORM_ID, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { QRCodeComponent, QRCodeErrorCorrectionLevel } from 'angularx-qrcode';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { UserPreferencesService, UrlToQrSettings } from '../../services/user-preferences.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';

@Component({
  selector: 'app-url-to-qr',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,  
    QRCodeComponent,
    PageHeaderComponent
  ],
  providers: [MessageService],
  templateUrl: './url-to-qr.component.html',
  styleUrl: './url-to-qr.component.scss'
})
export class UrlToQrComponent implements OnInit {
  // Content for inputs
  inputUrl: string = '';
  qrSize: number = 300;
  errorCorrectionLevel: QRCodeErrorCorrectionLevel = 'M';
  darkColor: string = '#000000';
  lightColor: string = '#FFFFFF';
  
  // QR code download link
  qrCodeDownloadLink: SafeUrl = '';
  
  // For JSON-LD
  isBrowser: boolean = false;
  private schemaScriptElement: HTMLElement | null = null;
  
  // URL текущей страницы для хранения настроек
  private pageUrl: string = 'url-to-qr';
  
  // Флаг для отслеживания изменений настроек
  private settingsChanged: boolean = false;
  
  // Options for error correction
  correctionLevelOptions = [
    { label: 'Low (L)', value: 'L' as QRCodeErrorCorrectionLevel },
    { label: 'Medium (M)', value: 'M' as QRCodeErrorCorrectionLevel },
    { label: 'Quartile (Q)', value: 'Q' as QRCodeErrorCorrectionLevel },
    { label: 'High (H)', value: 'H' as QRCodeErrorCorrectionLevel }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private metaService: Meta,
    private titleService: Title,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private userPreferencesService: UserPreferencesService,
    private seoService: SeoService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Получаем текущий URL для хранения настроек
    if (this.isBrowser) {
      this.pageUrl = this.router.url;
    }
  }

  ngOnInit() {
    // Set page title
    this.pageTitleService.setTitle('URL to QR Code Generator');
    
    // SEO setup
    this.setupSeo();
    
    // Загружаем сохраненные настройки
    this.loadUserPreferences();
    
    // Generate a sample QR code if no URL is provided
    if (!this.inputUrl) {
      this.loadSample();
    }
  }

  ngOnDestroy() {
    // Очищаем SEO элементы при уничтожении компонента
    this.seoService.destroy();
    
    // Сохраняем настройки при уничтожении компонента
    if (this.settingsChanged) {
      this.saveUserPreferences();
    }
  }

  /**
   * Загружает пользовательские настройки из localStorage
   */
  private loadUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings = this.userPreferencesService.loadPageSettings<UrlToQrSettings>(this.pageUrl);
    
    if (settings) {
      // Применяем сохраненные настройки
      if (settings.qrSize) {
        this.qrSize = settings.qrSize;
      }
      
      if (settings.errorCorrectionLevel) {
        this.errorCorrectionLevel = settings.errorCorrectionLevel as QRCodeErrorCorrectionLevel;
      }
      
      if (settings.darkColor) {
        this.darkColor = settings.darkColor;
      }
      
      if (settings.lightColor) {
        this.lightColor = settings.lightColor;
      }
    }
  }
  
  /**
   * Сохраняет пользовательские настройки в localStorage
   */
  private saveUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings: UrlToQrSettings = {
      qrSize: this.qrSize,
      errorCorrectionLevel: this.errorCorrectionLevel,
      darkColor: this.darkColor,
      lightColor: this.lightColor
    };
    
    this.userPreferencesService.savePageSettings(this.pageUrl, settings);
    this.settingsChanged = false;
  }

  /**
   * Setup metadata for SEO
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'URL to QR Code Generator | DevTools',
      OgDescription: 'Free online URL to QR Code generator. Create QR codes from any URL for easy mobile scanning with customizable options.',
      description: 'Free online URL to QR Code generator tool. Create QR codes from any URL for easy mobile scanning. Customize size, colors, and error correction level. No registration required.',
      keywords: ['URL to QR code', 'QR code generator', 'generate QR code from URL', 'URL QR code creator', 'QR code maker', 'custom QR code generator'],
      jsonLd: {
        name: 'URL to QR Code Generator',
        description: 'Free online tool for generating QR codes from URLs',
        url: 'https://onlinewebdevtools.com/url-to-qr'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }
  
  /**
   * Generate QR code from input URL
   */
  generateQrCode() {
    if (!this.inputUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter a URL to generate QR code'
      });
      return;
    }
    
    // Отмечаем, что настройки изменились
    this.settingsChanged = true;
  }

  /**
   * Handle QR code URL change event from the QRCodeComponent
   */
  onChangeQRCodeURL(url: SafeUrl) {
    this.qrCodeDownloadLink = url;
  }

  /**
   * Load sample URL
   */
  loadSample() {
    this.inputUrl = 'https://onlinewebdevtools.com';
    this.generateQrCode();
  }

  /**
   * Clear input
   */
  clearInput() {
    this.inputUrl = '';
  }

  /**
   * Handle QR size change
   */
  onQrSizeChange() {
    // Отмечаем, что настройки изменились и сохраняем их
    this.settingsChanged = true;
    this.saveUserPreferences();
  }
  
  /**
   * Handle error correction level change
   */
  onErrorCorrectionLevelChange() {
    // Отмечаем, что настройки изменились и сохраняем их
    this.settingsChanged = true;
    this.saveUserPreferences();
  }
  
  /**
   * Handle color change
   */
  onColorChange() {
    // Отмечаем, что настройки изменились и сохраняем их
    this.settingsChanged = true;
    this.saveUserPreferences();
  }

  /**
   * Download QR code as PNG
   */
  downloadQrCode() {
    if (!this.inputUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Generate a QR code first before downloading'
      });
      return;
    }

    try {
      // Находим canvas по id
      const canvas = document.getElementById('qrCodeCanvas')?.querySelector('canvas') as HTMLCanvasElement;
      
      if (canvas) {
        // Получаем данные изображения напрямую из canvas
        const dataUrl = canvas.toDataURL('image/png');
        
        // Создаем временную ссылку для скачивания
        const link = this.renderer.createElement('a');
        link.href = dataUrl;
        link.download = `qrcode-${new Date().getTime()}.png`;
        link.click();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'QR code downloaded successfully'
        });
      } else {
        throw new Error('QR Code canvas not found');
      }
    } catch (err) {
      console.error('Error downloading QR code:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download QR code. Please try again.'
      });
    }
  }

  /**
   * Paste from clipboard
   */
  pasteFromClipboard() {
    if (this.isBrowser) {
      navigator.clipboard.readText()
        .then(text => {
          this.inputUrl = text;
          this.generateQrCode();
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
} 