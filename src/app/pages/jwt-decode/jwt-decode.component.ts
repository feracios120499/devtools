import { Component, OnInit, PLATFORM_ID, Inject, NgZone, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, DOCUMENT } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { UserPreferencesService, JwtDecodeSettings } from '../../services/user-preferences.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

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
    MonacoEditorLazyComponent,
    ButtonModule,
    CheckboxModule,
    SelectModule,
    ToastModule,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule,
  ],
  providers: [MessageService],
  templateUrl: './jwt-decode.component.html',
  styleUrl: './jwt-decode.component.scss'
})
export class JwtDecodeComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';

  // Literal code examples used in SEO content (avoid Angular's ICU/interpolation parser)
  readonly jwtHeaderExample: string = '{ "alg": "HS256", "typ": "JWT" }';

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
    private seoService: SeoService,
    private monacoConfigService: MonacoConfigService
  ) {
    
    // Initialize editor options
    this.initializeEditorOptions();

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
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/jwt-decode';
    const shortDescription = 'Decode and verify JWT tokens online. Free in-browser JWT decoder and HMAC signature verifier for HS256, HS384 and HS512. No signup, no upload.';

    const metaData: MetaData = {
      OgTitle: 'JWT Decoder, Verifier & Inspector Online | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'JWT decoder',
        'JWT verifier',
        'JSON Web Token decoder',
        'decode JWT online',
        'verify JWT signature',
        'JWT inspector',
        'JWT parser',
        'HS256 verifier',
        'JWT claims viewer',
        'online JWT tool',
        'JWT debugger',
        'JWT token decoder'
      ],
      jsonLd: {
        name: 'JWT Decoder, Verifier & Inspector Online | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Decode JWT header, payload and signature',
          'Verify HMAC signatures (HS256, HS384, HS512)',
          'Support for Base64-encoded secret keys',
          'Automatic algorithm detection from the token header',
          'Inspect registered claims (iss, sub, aud, exp, iat) and custom claims',
          'Copy decoded header or payload to clipboard',
          'Client-side processing for privacy'
        ]
      },
      faq: [
        {
          question: 'Is this JWT decoder free to use?',
          answer: "Yes, it's completely free with no registration, ads, or usage limits."
        },
        {
          question: 'Do you store my JWT tokens or secrets?',
          answer: 'No, all decoding and signature verification is performed locally in your browser. Your tokens and secret keys never touch our servers.'
        },
        {
          question: 'Which JWT signature algorithms can be verified in the browser?',
          answer: 'HMAC algorithms HS256, HS384 and HS512 are supported for signature verification directly in the browser. Asymmetric algorithms such as RS256 or ES256 can still be decoded, but their signatures must be verified on a server that has access to the public key.'
        },
        {
          question: 'How do I verify a JWT signature?',
          answer: 'Paste the JWT into the input field, then enter the matching secret key in the verification panel. The algorithm is auto-detected from the token header, and a green "Signature Verified" badge confirms the token has not been tampered with.'
        },
        {
          question: 'What do claims like iss, sub, aud, exp and iat mean?',
          answer: 'These are standard registered JWT claims defined in RFC 7519: iss (issuer), sub (subject / user ID), aud (audience), exp (expiration time as a Unix timestamp) and iat (issued-at time). Tokens may also include custom claims specific to your application.'
        },
        {
          question: 'Can I decode an expired JWT?',
          answer: 'Yes. Decoding a JWT only reads its header and payload, so expired tokens are fully decodable. Signature verification is independent of the exp claim — your application is responsible for rejecting expired tokens at authentication time.'
        },
        {
          question: 'Is it safe to paste a JWT into an online decoder?',
          answer: 'All processing in this tool happens client-side, so tokens are not uploaded. Still, treat JWTs as credentials — avoid pasting production tokens or production secret keys into any third-party tool, and rotate any key that may have been exposed.'
        },
        {
          question: "What's the difference between signing a JWT and encrypting it (JWS vs JWE)?",
          answer: 'A signed JWT (JWS, RFC 7515) is integrity-protected but its payload is only Base64URL-encoded, not encrypted — anyone can read it. An encrypted JWT (JWE, RFC 7516) keeps the payload confidential. This tool works with signed JWTs, which are the most common format used in authentication.'
        }
      ],
      howTo: {
        name: 'How to decode and verify a JWT online',
        description: 'Decode a JSON Web Token and optionally verify its HMAC signature directly in your browser.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste JWT',
            text: 'Paste your JWT into the input field, or click the Sample button to load an example token. The tool automatically splits it into header, payload and signature.',
            url: pageUrl + '#input'
          },
          {
            name: 'Review decoded parts',
            text: 'Inspect the decoded header (algorithm, token type, key id) and optionally verify the HMAC signature by entering the matching secret key and selecting an HS256, HS384 or HS512 algorithm.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy or inspect',
            text: 'Review the decoded payload claims (sub, iss, aud, exp, iat) in the JSON viewer and copy the header or payload to the clipboard for documentation, debugging or sharing with your team.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Text Tools', url: 'https://onlinewebdevtools.com/#text-tools' },
        { name: 'JWT Decoder', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }
  
  /**
   * Initialize editor options
   */
  private initializeEditorOptions() {
    // Editor options are already defined in the class, no need to modify
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