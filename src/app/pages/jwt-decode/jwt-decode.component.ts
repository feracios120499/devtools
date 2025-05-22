import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { UserPreferencesService, JwtDecodeSettings } from '../../services/user-preferences.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';

// Only declare Monaco type for type checking, don't use directly
// It will be accessed dynamically only in browser context
interface Monaco {
  editor: any;
  languages: any;
}

// Доступные алгоритмы для подписи JWT
interface SignatureAlgorithm {
  name: string;
  value: string;
}

@Component({
  selector: 'app-jwt-decode',
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
  templateUrl: './jwt-decode.component.html',
  styleUrl: './jwt-decode.component.scss'
})
export class JwtDecodeComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  
  // JWT input
  jwtToken: string = '';
  
  // JWT parts
  header: any = null;
  payload: any = null;
  signature: string = '';
  
  // JWT verification
  secret: string = '';
  isSecretBase64Encoded: boolean = false;
  isSignatureValid: boolean | null = null;
  
  // JWT display
  formattedHeader: string = '';
  formattedPayload: string = '';
  
  // For tracking CryptoJS loading attempts
  private cryptoJsRetryCount: number = 0;
  private readonly MAX_CRYPTO_JS_RETRIES: number = 5;
  
  // Signature algorithms
  algorithms: SignatureAlgorithm[] = [
    { name: 'HS256 (HMAC with SHA-256)', value: 'HS256' },
    { name: 'HS384 (HMAC with SHA-384)', value: 'HS384' },
    { name: 'HS512 (HMAC with SHA-512)', value: 'HS512' }
  ];
  
  selectedAlgorithm: SignatureAlgorithm = this.algorithms[0]; // Default HS256
  
  // Параметры для editor Monaco
  @ViewChild('headerEditor') headerEditor: any;
  @ViewChild('payloadEditor') payloadEditor: any;
  
  // Тема редактора
  editorTheme: string = 'vs-dark'; // Default theme
  
  // URL текущей страницы для хранения настроек
  private pageUrl: string = 'jwt-decode';
  
  // Настройки для редакторов
  editorOptions = {
    theme: this.editorTheme,
    language: 'json',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    readOnly: true,
    wordWrap: 'on',
    scrollbar: {
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  };
  
  isBrowser: boolean = false;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private metaService: Meta,
    private titleService: Title,
    private messageService: MessageService,
    private router: Router,
    private userPreferencesService: UserPreferencesService,
    private seoService: SeoService
  ) {
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
    // Start with empty input
    this.jwtToken = '';
    
    // Load saved preferences
    this.loadUserPreferences();
    
    // SEO setup
    this.setupSeo();
    
    // Set page title
    this.pageTitleService.setTitle('JWT Decoder and Verifier');

    // Load crypto-js script for JWT verification
    if (this.isBrowser) {
      this.loadCryptoJs();
    }
  }
  
  ngAfterViewInit() {
    // No specific actions needed for AfterViewInit
  }
  
  ngOnDestroy() {
    // Clean up SEO elements when component is destroyed
    this.seoService.destroy();
  }
  
  /**
   * Loads the crypto-js script
   */
  private loadCryptoJs() {
    if (!this.isBrowser) return;
    
    // Check if script is already loaded
    if ((window as any).CryptoJS) return;

    const script = this.document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
    script.async = true;
    script.defer = true;
    
    // Add script loading event handlers
    script.onload = () => {
      console.log('CryptoJS library loaded successfully');
    };
    
    script.onerror = (error) => {
      console.error('Error loading CryptoJS library:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load CryptoJS library. Signature verification may not work.',
        life: 5000
      });
    };
    
    this.document.body.appendChild(script);
  }
  
  /**
   * Loads user preferences from localStorage
   */
  private loadUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings = this.userPreferencesService.loadPageSettings<JwtDecodeSettings>(this.pageUrl);
    
    if (settings) {
      // Load saved algorithm
      if (settings.algorithm) {
        const savedAlgorithm = this.algorithms.find(alg => alg.value === settings.algorithm);
        if (savedAlgorithm) {
          this.selectedAlgorithm = savedAlgorithm;
        }
      }
      
      // Load secret encoding setting
      if (settings.isSecretBase64Encoded !== undefined) {
        this.isSecretBase64Encoded = settings.isSecretBase64Encoded;
      }
    }
  }
  
  /**
   * Saves user preferences to localStorage
   */
  private saveUserPreferences() {
    if (!this.isBrowser) return;
    
    const settings: JwtDecodeSettings = {
      algorithm: this.selectedAlgorithm.value,
      isSecretBase64Encoded: this.isSecretBase64Encoded
    };
    
    this.userPreferencesService.savePageSettings(this.pageUrl, settings);
  }
  
  /**
   * Algorithm change handler
   */
  onAlgorithmChange() {
    this.saveUserPreferences();
    this.verifySignature();
  }
  
  /**
   * Secret Base64 encoding option change handler
   */
  onSecretEncodingChange() {
    this.saveUserPreferences();
    this.verifySignature();
  }
  
  /**
   * JWT token change handler
   */
  onJwtTokenChange() {
    this.decodeJwt();
  }

  /**
   * Secret change handler
   */
  onSecretChange() {
    this.verifySignature();
  }
  
  /**
   * Decodes JWT token
   */
  decodeJwt() {
    if (!this.jwtToken || !this.jwtToken.trim()) {
      this.clearDecodedData();
      return;
    }
    
    try {
      // Split JWT into parts
      const parts = this.jwtToken.split('.');
      
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. Expected 3 parts (header.payload.signature)');
      }
      
      // Decode header and payload
      this.header = JSON.parse(this.decodeBase64Url(parts[0]));
      this.payload = JSON.parse(this.decodeBase64Url(parts[1]));
      this.signature = parts[2];
      
      // Set selected algorithm based on header
      if (this.header && this.header.alg) {
        const algorithmFromHeader = this.algorithms.find(alg => alg.value === this.header.alg);
        if (algorithmFromHeader) {
          this.selectedAlgorithm = algorithmFromHeader;
          this.saveUserPreferences();
        } else {
          // If algorithm is not supported, show warning
          this.messageService.add({
            severity: 'warn',
            summary: 'Unsupported Algorithm',
            detail: `Algorithm ${this.header.alg} is not supported for verification in browser. Only HMAC algorithms (HS256, HS384, HS512) are supported.`,
            life: 5000
          });
        }
      }
      
      // Format data for display
      this.formattedHeader = JSON.stringify(this.header, null, 2);
      this.formattedPayload = JSON.stringify(this.payload, null, 2);
      
      // Verify signature if secret is provided
      if (this.secret) {
        this.verifySignature();
      } else {
        this.isSignatureValid = null;
      }
    } catch (e) {
      console.error('Error decoding JWT:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: e instanceof Error ? e.message : 'Invalid JWT token',
        life: 5000
      });
      this.clearDecodedData();
    }
  }
  
  /**
   * Verifies JWT signature
   */
  verifySignature() {
    if (!this.isBrowser || !this.jwtToken || !this.header || !this.payload || !this.secret) {
      this.isSignatureValid = null;
      return;
    }
    
    try {
      // Check if crypto-js is loaded
      if (!(window as any).CryptoJS) {
        // Increment retry counter
        this.cryptoJsRetryCount++;
        
        // Check if retry limit is exceeded
        if (this.cryptoJsRetryCount > this.MAX_CRYPTO_JS_RETRIES) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load CryptoJS library. Please try again later.',
            life: 5000
          });
          this.isSignatureValid = null;
          this.cryptoJsRetryCount = 0; // Reset counter
          return;
        }
        
        console.warn(`CryptoJS not loaded yet, retrying in 500ms (attempt ${this.cryptoJsRetryCount}/${this.MAX_CRYPTO_JS_RETRIES})`);
        setTimeout(() => this.verifySignature(), 500);
        return;
      }
      
      // If we reached this point, CryptoJS is loaded
      this.cryptoJsRetryCount = 0; // Reset counter
      
      const CryptoJS = (window as any).CryptoJS;
      
      // Get JWT parts
      const parts = this.jwtToken.split('.');
      const headerBase64 = parts[0];
      const payloadBase64 = parts[1];
      const providedSignature = parts[2];
      const data = `${headerBase64}.${payloadBase64}`;
      
      // Get secret key, decode from Base64 if needed
      let secretKey = this.secret;
      if (this.isSecretBase64Encoded) {
        // If secret is Base64 encoded, decode it
        try {
          secretKey = atob(this.secret);
        } catch (e) {
          throw new Error('Invalid Base64 secret key');
        }
      }
      
      // Calculate signature based on algorithm
      let computedSignature;
      
      // Get algorithm from header or user selection
      const alg = this.header.alg || this.selectedAlgorithm.value;
      
      // HMAC signature
      const bitLength = parseInt(alg.substring(2), 10);
      let hmac;
      
      switch(bitLength) {
        case 256:
          hmac = CryptoJS.HmacSHA256(data, secretKey);
          break;
        case 384:
          hmac = CryptoJS.HmacSHA384(data, secretKey);
          break;
        case 512:
          hmac = CryptoJS.HmacSHA512(data, secretKey);
          break;
        default:
          throw new Error(`Unsupported algorithm: ${alg}`);
      }
      
      // Convert to Base64Url
      const wordArray = CryptoJS.enc.Base64.parse(CryptoJS.enc.Base64.stringify(hmac));
      computedSignature = this.base64ToBase64Url(CryptoJS.enc.Base64.stringify(wordArray));
      
      // Compare computed and provided signatures
      this.isSignatureValid = computedSignature === providedSignature;
      
    } catch (e) {
      console.error('Error verifying JWT signature:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Verification Error',
        detail: e instanceof Error ? e.message : 'Error verifying signature',
        life: 5000
      });
      this.isSignatureValid = null;
    }
  }
  
  /**
   * Clears decoded data
   */
  private clearDecodedData() {
    this.header = null;
    this.payload = null;
    this.signature = '';
    this.formattedHeader = '';
    this.formattedPayload = '';
    this.isSignatureValid = null;
  }
  
  /**
   * Decodes string from Base64Url to UTF-8
   */
  private decodeBase64Url(input: string): string {
    // Convert Base64Url to Base64
    const base64 = this.base64UrlToBase64(input);
    
    // Decode Base64
    const binaryStr = atob(base64);
    
    // Convert binary string to UTF-8
    return decodeURIComponent(
      Array.from(binaryStr)
        .map(char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
  
  /**
   * Converts Base64Url to Base64
   */
  private base64UrlToBase64(base64Url: string): string {
    // Replace Base64Url characters with standard Base64
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add missing padding characters '='
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return base64;
  }
  
  /**
   * Converts Base64 to Base64Url
   */
  private base64ToBase64Url(base64: string): string {
    // Replace Base64 characters with Base64Url
    return base64.replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, ''); // Remove padding characters
  }
  
  /**
   * Copies text to clipboard
   */
  copyToClipboard(text: string, type: string) {
    if (!this.isBrowser || !text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: `${type} copied to clipboard`,
        life: 3000
      });
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard',
        life: 3000
      });
    });
  }
  
  /**
   * Loads sample JWT
   */
  loadSampleJwt() {
    // Sample JWT with HS256
    this.jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    this.secret = 'your-256-bit-secret';
    this.decodeJwt();
  }
  
  /**
   * Clears input fields
   */
  clearInput() {
    this.jwtToken = '';
    this.secret = '';
    this.clearDecodedData();
  }
  
  /**
   * Pastes from clipboard
   */
  pasteFromClipboard() {
    if (!this.isBrowser) return;
    
    navigator.clipboard.readText().then((text) => {
      this.jwtToken = text;
      this.decodeJwt();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Pasted!',
        detail: 'JWT token pasted from clipboard',
        life: 3000
      });
    }).catch((err) => {
      console.error('Error pasting from clipboard: ', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to paste from clipboard',
        life: 3000
      });
    });
  }
  
  /**
   * Sets up SEO for the page
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'JWT Decoder and Verifier | DevTools',
      OgDescription: 'Free online JWT decoder and verifier. Decode and verify JSON Web Tokens, inspect header and payload data.',
      description: 'Free online JWT decoder and verifier tool. Easily decode JWT tokens, inspect header and payload data, and verify signatures with various algorithms including HS256, RS256, and more.',
      keywords: ['jwt decoder', 'jwt verifier', 'json web token', 'decode jwt', 'verify jwt', 'jwt inspector', 'jwt token'],
      jsonLd: {
        name: 'JWT Decoder and Verifier',
        description: 'Online tool for decoding and verifying JSON Web Tokens (JWT)',
        url: 'https://onlinewebdevtools.com/jwt-decode'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }
  
  /**
   * Updates Monaco editor theme
   */
  updateEditorTheme() {
    this.editorOptions = {
      ...this.editorOptions,
      theme: this.editorTheme
    };
    
    // Update editors if they exist
    if (this.headerEditor?._editor) {
      this.headerEditor._editor.updateOptions({ theme: this.editorTheme });
    }
    
    if (this.payloadEditor?._editor) {
      this.payloadEditor._editor.updateOptions({ theme: this.editorTheme });
    }
  }
} 