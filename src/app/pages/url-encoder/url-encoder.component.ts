import { Component, OnInit, Pipe, PipeTransform, Inject, PLATFORM_ID, Renderer2, HostBinding } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

interface UrlComponent {
  name: string;
  value: string;
  description: string;
}

@Pipe({
  name: 'nl2br',
  standalone: true
})
export class Nl2brPipe implements PipeTransform {
  @HostBinding('class') class = 'dt-page';
  
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return value;
    return this.sanitizer.bypassSecurityTrustHtml(value.replace(/\n/g, '<br>'));
  }
}

@Component({
  selector: 'app-url-encoder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    Nl2brPipe,
    PageHeaderComponent
  ],
  providers: [MessageService],
  templateUrl: './url-encoder.component.html',
  styleUrl: './url-encoder.component.scss'
})
export class UrlEncoderComponent implements OnInit {
  // Content for inputs
  inputText: string = '';
  outputText: string = '';
  
  // URL parsing
  urlComponents: UrlComponent[] = [];
  
  // Tab selection: 1 = decode, 2 = encode
  activeTab: number = 1;

  // For JSON-LD
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
    private messageService: MessageService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Set page title
    this.pageTitleService.setTitle('URL Encoder/Decoder');
    
    // Initialize URL components array with empty values
    this.initUrlComponents();
    
    // SEO setup
    this.setupSeo();
    
    // Add JSON-LD to head
    this.addJsonLdToHead();
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
      content: 'Free online URL encoder and decoder tool. Safely encode and decode URLs for web applications. Convert special characters to URL-friendly format and back with just a click.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'URL encoder, URL decoder, encode URL, decode URL, URL escape, URL unescape, URL components, URL structure' 
    });
    
    // Open Graph meta tags for better social sharing
    this.metaService.updateTag({ property: 'og:title', content: 'URL Encoder and Decoder | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Free online URL encoder and decoder tool. Safely encode and decode URLs for web use. Convert special characters and decode encoded URLs easily.' });
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
      "name": "URL Encoder and Decoder",
      "description": "Free online tool for encoding and decoding URLs for web use",
      "applicationCategory": "Utilities",
      "operatingSystem": "All",
      "url": "https://onlinewebdevtools.com/url-encoder"
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

  initUrlComponents() {
    this.urlComponents = [
      { name: 'Protocol', value: '', description: 'The protocol used (e.g., http, https)' },
      { name: 'Username', value: '', description: 'Optional username in URL authentication' },
      { name: 'Password', value: '', description: 'Optional password in URL authentication' },
      { name: 'Domain', value: '', description: 'The domain or hostname' },
      { name: 'Port', value: '', description: 'Optional port number' },
      { name: 'Path', value: '', description: 'The path to the resource' },
      { name: 'Query Parameters', value: '', description: 'Parameters passed to the server' },
      { name: 'Hash/Fragment', value: '', description: 'Anchor to a specific part of the page' }
    ];
  }

  processText() {
    if (this.activeTab == 1) {
      // Decode
      try {
        this.outputText = decodeURIComponent(this.inputText);
        this.parseUrl(this.outputText);
      } catch(e) {
        this.outputText = 'Error: Invalid encoded URL';
        this.initUrlComponents();
      }
    } else {
      // Encode
      this.outputText = encodeURIComponent(this.inputText);
      this.parseUrl(this.inputText);
    }
  }

  parseUrl(url: string) {
    // Reset components first
    this.initUrlComponents();
    
    if (!url) return;
    
    try {
      // Use URL API to parse the URL string
      let urlObj: URL;
      try {
        urlObj = new URL(url);
      } catch (e) {
        // If it fails, try adding https:// prefix and try again
        try {
          if (!url.match(/^[a-zA-Z]+:\/\//)) {
            urlObj = new URL('https://' + url);
          } else {
            throw e;
          }
        } catch (e2) {
          // If still fails, we cannot parse it
          return;
        }
      }
      
      // Extract components
      this.urlComponents[0].value = urlObj.protocol.replace(':', '');
      
      // Username and password
      if (urlObj.username) {
        this.urlComponents[1].value = urlObj.username;
      }
      if (urlObj.password) {
        this.urlComponents[2].value = urlObj.password;
      }
      
      // Domain name
      this.urlComponents[3].value = urlObj.hostname;
      
      // Port
      if (urlObj.port) {
        this.urlComponents[4].value = urlObj.port;
      }
      
      // Path
      if (urlObj.pathname && urlObj.pathname !== '/') {
        this.urlComponents[5].value = urlObj.pathname;
      }
      
      // Query parameters - if there are any, parse them into a formatted string
      if (urlObj.search) {
        const params = new URLSearchParams(urlObj.search);
        let paramsArray: string[] = [];
        
        params.forEach((value, key) => {
          paramsArray.push(`${key}=${value}`);
        });
        
        // If there are multiple params, format them with linebreaks
        if (paramsArray.length > 1) {
          this.urlComponents[6].value = paramsArray.join('\n');
        } else {
          this.urlComponents[6].value = paramsArray.join('');
        }
      }
      
      // Hash/fragment
      if (urlObj.hash) {
        this.urlComponents[7].value = urlObj.hash;
      }
    } catch (e) {
      console.error('Error parsing URL:', e);
      // If there's an error, we just leave the components empty
    }
  }

  pasteFromClipboard() {
    navigator.clipboard.readText().then((text) => {
      this.inputText = text;
      this.processText();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Pasted!',
        detail: 'Text pasted from clipboard',
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

  loadSample() {
    console.log(this.activeTab);
    if (this.activeTab == 1) {
      // Sample for decode
      this.inputText = 'https%3A%2F%2Fexample.com%2Fpath%3Fparam1%3Dvalue1%26param2%3Dvalue2%23section';
      console.log(this.inputText);
    } else {
      // Sample for encode
      this.inputText = 'https://example.com/path?param1=value1&param2=value2#section';
    }
    this.processText();
  }

  clearText() {
    this.inputText = '';
    this.outputText = '';
    this.initUrlComponents();
  }

  copyToClipboard() {
    if (!this.outputText) return;
    
    navigator.clipboard.writeText(this.outputText).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: 'Text copied to clipboard',
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
   * Copy a specific URL component value to clipboard
   */
  copyComponentValue(component: UrlComponent) {
    if (!component.value) return;
    
    navigator.clipboard.writeText(component.value).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: `${component.name} copied to clipboard`,
        life: 3000
      });
    }).catch((err) => {
      console.error('Failed to copy:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard',
        life: 3000
      });
    });
  }
} 