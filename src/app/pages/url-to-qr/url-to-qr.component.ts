import { Component, OnInit, Inject, PLATFORM_ID, Renderer2, ViewChild, ElementRef, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { QRCodeComponent, QRCodeErrorCorrectionLevel } from 'angularx-qrcode';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { UserPreferencesService, UrlToQrSettings } from '../../services/user-preferences.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

@Component({
  selector: 'app-url-to-qr',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    ColorPickerModule,
    SelectModule,
    SliderModule,
    TextareaModule,
    ToastModule,
    QRCodeComponent,
    PageHeaderComponent,
    AnchorHeadingDirective,
    RouterModule
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
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/url-to-qr';
    const shortDescription = 'Free online URL to QR code generator. Create custom QR codes from any URL with adjustable size, colors and error correction. Runs entirely in your browser.';

    const metaData: MetaData = {
      OgTitle: 'URL to QR Code Generator Online | Free Custom QR Codes',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'URL to QR code',
        'QR code generator',
        'generate QR code from URL',
        'URL QR code creator',
        'QR code maker',
        'custom QR code generator',
        'online QR code generator',
        'free QR code generator',
        'QR code with logo',
        'QR code with colors',
        'QR code error correction',
        'QR code download PNG'
      ],
      jsonLd: {
        name: 'URL to QR Code Generator Online | Free Custom QR Codes',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Generate QR codes from any URL or text',
          'Adjustable size from 100 px to 500 px',
          'Custom foreground and background colors',
          'Four error-correction levels (L, M, Q, H)',
          'Live preview with instant regeneration',
          'One-click PNG download',
          'Client-side processing for privacy',
          'Offline-capable after initial page load'
        ]
      },
      faq: [
        {
          question: 'What size should my QR code be?',
          answer: 'For print, a safe rule is at least 2 cm x 2 cm (about 100 px at 300 DPI) when scanned from close range. For posters or billboards, increase the size proportionally to the scanning distance — roughly 1 cm of QR code for every 10 cm of distance.'
        },
        {
          question: 'Can I customize the QR code style and colors?',
          answer: 'Yes. You can choose any foreground and background color with the built-in color pickers. Just make sure there is enough contrast between the two colors — dark on light is the most reliable combination for scanners.'
        },
        {
          question: 'Does the generator work offline?',
          answer: 'Yes. All encoding and rendering runs in your browser via JavaScript, so once the page is loaded you can disconnect from the internet and continue generating QR codes.'
        },
        {
          question: 'Which devices and apps can scan these QR codes?',
          answer: 'Any modern smartphone camera (iOS 11+, Android 8+) and most third-party QR scanner apps. The codes follow the ISO/IEC 18004 specification, so they are universally compatible.'
        },
        {
          question: 'What is the maximum amount of data I can encode?',
          answer: 'A QR code supports up to 4,296 alphanumeric characters or 2,953 bytes in the largest version (40) with the lowest error-correction level (L). For URLs, this is more than enough for virtually any long link.'
        },
        {
          question: 'Is it safe to use this online generator for private URLs?',
          answer: 'Yes. Your input never leaves your browser because the entire QR generation happens client-side with JavaScript. We do not log, store or transmit any data you enter.'
        },
        {
          question: 'Which error-correction level should I choose?',
          answer: 'For most URLs, M (Medium, 15% recovery) is a good default. Use H (High, 30%) when the QR code might be dirty, damaged or needs a logo in the center; use L (Low) only when you need to pack the maximum amount of data in the smallest possible code.'
        },
        {
          question: 'Can I download the QR code as SVG or only PNG?',
          answer: 'The current export is PNG, rendered from a high-resolution canvas. Because PNG is lossless, it scales well for most use cases. SVG export is on the roadmap.'
        }
      ],
      howTo: {
        name: 'How to generate a QR code from a URL online',
        description: 'Create a custom QR code from any URL or text in three steps, entirely in your browser.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Enter URL',
            text: 'Paste your URL or any text into the input field. The QR code preview updates in real time as you type.',
            url: pageUrl + '#input'
          },
          {
            name: 'Customize style',
            text: 'Adjust the size slider, pick foreground and background colors, and choose an error-correction level (L, M, Q or H) that matches your use case.',
            url: pageUrl + '#options'
          },
          {
            name: 'Download QR',
            text: 'Click the Download button to save the generated QR code as a high-resolution PNG image, ready for print or digital use.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Image Tools', url: 'https://onlinewebdevtools.com/#image-tools' },
        { name: 'URL to QR Code', url: pageUrl }
      ]
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