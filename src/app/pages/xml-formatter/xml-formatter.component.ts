import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, ElementRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MenuItem, MessageService } from 'primeng/api';
import { camelCase, snakeCase, pascalCase, kebabCase } from 'change-case';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { MonacoScrollFixDirective } from '../../shared/directives/monaco-scroll-fix.directive';
import { Router } from '@angular/router';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

// Interfaces for type safety
interface SpacingOption {
  label: string;
  value: number;
}

interface TagCaseOption {
  label: string;
  value: string;
  transform: (tag: string) => string;
}

@Component({
  selector: 'app-xml-formatter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule,
    MonacoScrollFixDirective,
    AnchorHeadingDirective
  ],
  providers: [MessageService],
  templateUrl: './xml-formatter.component.html',
  styleUrl: './xml-formatter.component.scss'
})
export class XmlFormatterComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'dt-page';
  inputCode: string = '';
  outputCode: string = '';

  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;

  editorTheme: string = 'vs-dark'; // Default theme

  // Spacing options for the dropdown
  spacingOptions: SpacingOption[] = [
    { label: '2 Spaces', value: 2 },
    { label: '4 Spaces', value: 4 }
  ];

  // Default spacing selection
  selectedSpacing: SpacingOption = this.spacingOptions[0];

  // Options for tag case styling
  tagCaseOptions: TagCaseOption[] = [
    { label: 'Original', value: 'original', transform: (tag) => tag },
    { label: 'camelCase', value: 'camelCase', transform: camelCase },
    { label: 'snake_case', value: 'snakeCase', transform: snakeCase },
    { label: 'PascalCase', value: 'pascalCase', transform: pascalCase },
    { label: 'kebab-case', value: 'kebabCase', transform: kebabCase }
  ];

  // Default tag case selection
  selectedTagCase: TagCaseOption = this.tagCaseOptions[0];

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
    private router: Router,
    private monacoConfigService: MonacoConfigService
  ) {
    // Set page title
    this.pageTitleService.setTitle('XML Formatter, Beautifier & Viewer');
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Initialize editor options with placeholders
    this.inputEditorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'xml'),
      placeholder: 'Paste or type your XML here...\n\nExample:\n<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>value</item>\n</root>'
    };
    this.outputEditorOptions = {
      ...this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'xml'),
      placeholder: 'Formatted XML will appear here...\n\nThe formatter will:\n• Beautify structure with proper indentation\n• Validate XML syntax\n• Transform tag names if needed'
    };

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
  }

  // Handle ESC key to exit fullscreen mode
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.isInputFullscreen || this.isOutputFullscreen) {
      // Exit fullscreen mode
      this.isInputFullscreen = false;
      this.isOutputFullscreen = false;
      
      // Update editor sizes
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
    // Wheel event handling is now managed by MonacoScrollFixDirective
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  /**
   * Setup SEO metadata via SeoService
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'XML Formatter, Beautifier & Viewer | Free Online DevTools',
      OgDescription: 'Beautify, format and view XML online with this free DevTools utility. Clean up messy XML, validate structure, and copy or download your formatted code instantly.',
      description: 'Beautify, format and view XML online with this free DevTools utility. Clean up messy XML, validate structure, and copy or download your formatted code instantly.',
      keywords: ['XML formatter', 'XML beautifier', 'XML viewer', 'format XML online', 'view XML online', 'XML tools', 'beautify XML', 'pretty print XML', 'XML validator', 'XML highlighter'],
      jsonLd: {
        name: 'XML Formatter, Beautifier & Viewer | Free Online DevTools',
        description: 'Beautify, format and view XML online with this free DevTools utility. Clean up messy XML, validate structure, and copy or download your formatted code instantly.',
        url: 'https://onlinewebdevtools.com/xml-formatter'
      }
    };

    this.seoService.setupSeo(metaData);
  }

  /**
   * Handles spacing option change
   */
  onSpacingChange() {
    this.formatXml();
  }

  /**
   * Copy formatted XML to clipboard
   */
  copyToClipboard() {
    if (this.outputCode) {
      navigator.clipboard.writeText(this.outputCode).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied',
          detail: 'XML copied to clipboard',
          life: 3000
        });
      }).catch(err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy XML to clipboard',
          life: 3000
        });
      });
    }
  }

  /**
   * Download formatted XML as file
   */
  downloadXml() {
    if (this.outputCode) {
      const blob = new Blob([this.outputCode], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formatted.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded',
        detail: 'XML file downloaded successfully',
        life: 3000
      });
    }
  }

  /**
   * Paste from clipboard to input
   */
  pasteFromClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        this.inputCode = text;
        this.formatXml();
        this.messageService.add({
          severity: 'success',
          summary: 'Pasted',
          detail: 'Content pasted from clipboard',
          life: 3000
        });
      }).catch(err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to paste from clipboard',
          life: 3000
        });
      });
    }
  }

  /**
   * Load sample XML data
   */
  loadSampleXml() {
    this.inputCode = `<?xml version="1.0" encoding="UTF-8"?><catalog><book id="1"><title>The Great Gatsby</title><author>F. Scott Fitzgerald</author><year>1925</year><price currency="USD">12.99</price><genres><genre>Fiction</genre><genre>Classic</genre></genres></book><book id="2"><title>To Kill a Mockingbird</title><author>Harper Lee</author><year>1960</year><price currency="USD">14.99</price><genres><genre>Fiction</genre><genre>Drama</genre></genres></book></catalog>`;
    this.formatXml();
  }

  /**
   * Clear XML input
   */
  clearXml() {
    this.inputCode = '';
    this.outputCode = '';
  }

  /**
   * Update editor theme
   */
  updateEditorTheme() {
    this.inputEditorOptions = {
      ...this.inputEditorOptions,
      theme: this.editorTheme,
      placeholder: 'Paste or type your XML here...\n\nExample:\n<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>value</item>\n</root>'
    };
    this.outputEditorOptions = {
      ...this.outputEditorOptions,
      theme: this.editorTheme,
      placeholder: 'Formatted XML will appear here...\n\nThe formatter will:\n• Beautify structure with proper indentation\n• Validate XML syntax\n• Transform tag names if needed'
    };
  }

  /**
   * Format XML with proper indentation
   */
  formatXml() {
    if (!this.inputCode.trim()) {
      this.outputCode = '';
      return;
    }

    try {
      // Parse XML to check for errors
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(this.inputCode, 'application/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
      if (parseError) {
        this.outputCode = 'XML Parse Error: ' + parseError.textContent;
        return;
      }

      // Format the XML
      this.outputCode = this.prettyPrintXml(this.inputCode);
    } catch (error) {
      this.outputCode = 'Error formatting XML: ' + (error as Error).message;
    }
  }

  /**
   * Pretty print XML with proper indentation
   */
  private prettyPrintXml(xml: string): string {
    const PADDING = ' '.repeat(this.selectedSpacing.value);
    
    // Apply tag case transformation if not original
    let processedXml = xml;
    if (this.selectedTagCase.value !== 'original') {
      processedXml = this.transformXmlTags(xml, this.selectedTagCase.transform);
    }
    
    // Remove whitespace between tags and add line breaks
    const reg = /(>)\s*(<)(\/*)/g;
    let formatted = processedXml.replace(reg, '$1\r\n$2$3');
    
    let pad = 0;
    return formatted.split('\r\n').map((node, index) => {
      let indent = 0;
      const trimmedNode = node.trim();
      
      if (!trimmedNode) {
        return '';
      }
      
      if (trimmedNode.match(/.+<\/\w[^>]*>$/)) {
        // Self-closing tag or tag with content and closing tag on same line
        indent = 0;
      } else if (trimmedNode.match(/^<\/\w/)) {
        // Closing tag
        if (pad > 0) {
          pad -= 1;
        }
        indent = 0;
      } else if (trimmedNode.match(/^<\w[^>]*[^\/]>.*$/)) {
        // Opening tag
        indent = 1;
      } else if (trimmedNode.match(/^<\w.*\/>/)) {
        // Self-closing tag
        indent = 0;
      } else {
        indent = 0;
      }
      
      const padding = PADDING.repeat(pad);
      pad += indent;
      
      return padding + trimmedNode;
    }).filter(line => line.trim() !== '').join('\r\n');
  }

  /**
   * Transform XML tags according to selected case style
   */
  private transformXmlTags(xml: string, transformFn: (tag: string) => string): string {
    // Match opening and closing tags in XML
    const openingTagRegex = /<(\w+)([^>]*)>/g;
    const closingTagRegex = /<\/(\w+)>/g;
    
    // Transform opening tags
    let result = xml.replace(openingTagRegex, (match, tagName, attributes) => {
      const transformedTag = transformFn(tagName);
      return `<${transformedTag}${attributes}>`;
    });
    
    // Transform closing tags
    result = result.replace(closingTagRegex, (match, tagName) => {
      const transformedTag = transformFn(tagName);
      return `</${transformedTag}>`;
    });
    
    return result;
  }

  /**
   * Toggle fullscreen mode for editors
   */
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

  /**
   * Handles tag case option change
   */
  onTagCaseChange() {
    this.formatXml();
  }
} 