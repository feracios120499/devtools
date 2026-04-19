import { Component, OnInit, OnDestroy, Pipe, PipeTransform, Inject, PLATFORM_ID, Renderer2, HostBinding, DOCUMENT } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';
import { RouterModule } from '@angular/router';

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
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    RadioButtonModule,
    RippleModule,
    TableModule,
    TextareaModule,
    ToastModule,
    TooltipModule,
    Nl2brPipe,
    PageHeaderComponent,
    AnchorHeadingDirective,
    RouterModule
  ],
  providers: [MessageService],
  templateUrl: './url-encoder.component.html',
  styleUrl: './url-encoder.component.scss'
})
export class UrlEncoderComponent implements OnInit, OnDestroy {
  // Content for inputs
  inputText: string = '';
  outputText: string = '';
  
  // Components of the URL
  urlComponents: UrlComponent[] = [];
  
  // Current tab (1 = decode, 2 = encode)
  activeTab: number = 1;
  
  // Flag for browser checks
  isBrowser: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private metaService: Meta,
    private titleService: Title,
    private messageService: MessageService,
    private seoService: SeoService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Set page title
    this.pageTitleService.setTitle('URL Encoder/Decoder');
    
    // Initialize URL components array with empty values
    this.initUrlComponents();
    
    // Setup SEO
    this.setupSeo();
  }

  ngOnDestroy() {
    // Clean up SEO
    this.seoService.destroy();
  }

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/url-encoder';
    const shortDescription = 'Free online URL encoder and decoder. Percent-encode URLs and decode %XX sequences in your browser with no signup, no ads, no uploads.';

    const metaData: MetaData = {
      OgTitle: 'URL Encoder & Decoder Online - Percent-Encode URLs | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'url encoder',
        'url decoder',
        'url encoding',
        'url decoding',
        'percent encoding',
        'encodeURIComponent online',
        'decodeURIComponent online',
        'encode special characters in url',
        'decode url parameters',
        'uri encoder',
        'query string encoder',
        'online url tool'
      ],
      jsonLd: {
        name: 'URL Encoder & Decoder Online - Percent-Encode URLs | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Encode URLs and query parameters using percent-encoding (encodeURIComponent)',
          'Decode percent-encoded URLs back to readable text',
          'URL component inspector (protocol, host, port, path, query, fragment)',
          'UTF-8 aware encoding and decoding of non-ASCII characters',
          'One-click copy of the full result or individual URL components',
          'Paste from clipboard and load sample URLs instantly',
          'Client-side processing for privacy - no URL ever leaves your browser'
        ]
      },
      faq: [
        {
          question: 'What is the difference between encodeURI and encodeURIComponent?',
          answer: "encodeURI is meant for a complete URL and leaves reserved delimiters such as :/?#&= untouched. encodeURIComponent is meant for a single URL component (for example a query-string value) and also escapes those delimiters. This tool uses encodeURIComponent, which is the safe default when you are escaping user-provided values."
        },
        {
          question: 'Which characters are considered reserved in a URL?',
          answer: "Per RFC 3986 the reserved characters are :/?#[]@!$&'()*+,;=. Any other ASCII symbol outside the unreserved set (A-Z a-z 0-9 - . _ ~) must also be percent-encoded when used as data."
        },
        {
          question: 'How are Unicode characters handled?',
          answer: 'Non-ASCII characters are first encoded as UTF-8 bytes, then each byte is written as %XX. For example é becomes %C3%A9 and the emoji 😀 becomes %F0%9F%98%80.'
        },
        {
          question: 'What is the difference between + and %20 for spaces?',
          answer: 'In the application/x-www-form-urlencoded format (HTML form submissions) a space is encoded as +. In a generic URL path or query per RFC 3986 a space is encoded as %20. This tool produces %20, which is always safe; decoders accept either form.'
        },
        {
          question: 'Is it safe to paste sensitive URLs here?',
          answer: 'Yes. The tool runs entirely in your browser. Nothing you paste is uploaded, logged, or stored on any server.'
        },
        {
          question: 'Why does my decoded URL still contain % characters?',
          answer: 'That usually means the URL was encoded more than once (double-encoded). Run the decoder again on the result until no %XX sequences remain.'
        },
        {
          question: 'Is this URL encoder free?',
          answer: 'Yes - it is completely free with no registration, no ads, and no usage limits.'
        }
      ],
      howTo: {
        name: 'How to encode or decode URLs online',
        description: 'Encode or decode a URL in your browser in three steps.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste URL or text',
            text: 'Paste your URL or plain text into the Input URL field, or click Sample to load an example. Encoding runs in real time as you type.',
            url: pageUrl + '#input'
          },
          {
            name: 'Choose mode',
            text: 'Select Encode URL to percent-encode special characters, or Decode URL to unescape an already encoded URL.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy encoded or decoded result',
            text: 'Copy the result to your clipboard with a single click, or copy any individual parsed URL component (host, path, query) from the breakdown table.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Encoding Tools', url: 'https://onlinewebdevtools.com/#encoding-tools' },
        { name: 'URL Encoder', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
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