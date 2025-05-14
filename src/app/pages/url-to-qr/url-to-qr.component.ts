import { Component, OnInit, Inject, PLATFORM_ID, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { QRCodeComponent, QRCodeErrorCorrectionLevel } from 'angularx-qrcode';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { FavoritePageDirective } from '../../directives/favorite-page.directive';

@Component({
  selector: 'app-url-to-qr',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    FavoritePageDirective,
    QRCodeComponent
  ],
  providers: [MessageService],
  templateUrl: './url-to-qr.component.html',
  styleUrl: './url-to-qr.component.scss'
})
export class UrlToQrComponent implements OnInit {
  // Content for inputs
  inputUrl: string = '';
  qrSize: number = 200;
  errorCorrectionLevel: QRCodeErrorCorrectionLevel = 'M';
  darkColor: string = '#000000';
  lightColor: string = '#FFFFFF';
  
  // QR code download link
  qrCodeDownloadLink: SafeUrl = '';
  
  // For JSON-LD
  isBrowser: boolean = false;
  private schemaScriptElement: HTMLElement | null = null;
  
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
    private sanitizer: DomSanitizer
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Set page title
    this.pageTitleService.setTitle('URL to QR Code Generator');
    
    // SEO setup
    this.setupSeo();
    
    // Add JSON-LD to head
    this.addJsonLdToHead();
    
    // Generate a sample QR code
    this.loadSample();
  }

  ngOnDestroy() {
    // Remove JSON-LD script element when component is destroyed
    if (this.isBrowser && this.schemaScriptElement) {
      try {
        this.renderer.removeChild(this.document.head, this.schemaScriptElement);
      } catch (e) {
        console.error('Error removing JSON-LD script:', e);
      }
    }
  }

  /**
   * Setup metadata for SEO
   */
  private setupSeo() {
    if (!this.metaService) {
      console.error('Meta service is not available');
      return;
    }
    
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Free online URL to QR Code generator tool. Create QR codes from any URL for easy mobile scanning. Customize size, colors, and error correction level. No registration required.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'URL to QR code, QR code generator, generate QR code from URL, URL QR code creator, QR code maker, custom QR code generator' 
    });
    
    // Open Graph meta tags for better social sharing
    this.metaService.updateTag({ property: 'og:title', content: 'URL to QR Code Generator | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Free online URL to QR Code generator. Create customizable QR codes from any URL for easy mobile scanning.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
  }
  
  /**
   * Add JSON-LD schema to document head
   */
  private addJsonLdToHead() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "URL to QR Code Generator",
      "description": "Free online tool for generating QR codes from URLs",
      "applicationCategory": "Utilities",
      "operatingSystem": "All",
      "url": "https://onlinewebdevtools.com/url-to-qr"
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