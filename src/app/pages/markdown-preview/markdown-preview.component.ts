import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { MonacoScrollFixDirective } from '../../shared/directives/monaco-scroll-fix.directive';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';

@Component({
  selector: 'app-markdown-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule,
    MonacoScrollFixDirective
  ],
  providers: [MessageService],
  templateUrl: './markdown-preview.component.html',
  styleUrl: './markdown-preview.component.scss'
})
export class MarkdownPreviewComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'dt-page';
  
  inputText: string = '';
  renderedHtml: SafeHtml = '';
  
  @ViewChild('monacoEditor') monacoEditor: any;
  
  editorTheme: string = 'vs-dark';
  
  editorOptions = {
    theme: this.editorTheme,
    language: 'markdown',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    wordWrap: 'on',
    scrollbar: {
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    },
    fixedOverflowWidgets: true
  };

  isBrowser: boolean = false;
  isFullscreen: boolean = false;
  isPreviewFullscreen: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private monacoConfigService: MonacoConfigService
  ) {
    this.pageTitleService.setTitle('Markdown Preview');
    
    // Initialize editor options
    this.initializeEditorOptions();

    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }
  }

  ngOnInit() {
    this.setupSeo();
    if(this.isBrowser) {
      this.loadSampleMarkdown();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderMarkdown(), 500);
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'Markdown Preview - Online Markdown Renderer | DevTools',
      OgDescription: 'Free online Markdown preview tool. Write Markdown on the left and see real-time HTML preview on the right. Perfect for documentation and content creation.',
      description: 'Online Markdown preview and renderer tool. Write Markdown syntax and see instant HTML preview. Supports all standard Markdown features for documentation and content creation.',
      keywords: ['markdown preview', 'markdown editor', 'markdown to html', 'markdown renderer', 'documentation tool', 'content creation', 'markdown converter', 'real-time preview'],
      jsonLd: {
        name: 'Markdown Preview - Online Markdown Renderer',
        description: 'Online Markdown preview tool with real-time HTML rendering',
        url: 'https://onlinewebdevtools.com/markdown-preview'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }

  renderMarkdown(): void {
    if (!this.inputText.trim()) {
      this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml('');
      return;
    }

    try {
      // Configure marked options
      marked.setOptions({
        breaks: true,
        gfm: true
      });

      const html = marked(this.inputText);
      this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(html as string);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml('<p class="error">Error rendering markdown</p>');
    }
  }

  onTextChange(): void {
    this.renderMarkdown();
  }

  copyToClipboard(): void {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.writeText(this.inputText).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied',
          detail: 'Markdown text copied to clipboard'
        });
      }).catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy to clipboard'
        });
      });
    }
  }

  pasteFromClipboard(): void {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.readText().then(text => {
        this.inputText = text;
        this.renderMarkdown();
        this.messageService.add({
          severity: 'success',
          summary: 'Pasted',
          detail: 'Text pasted from clipboard'
        });
      }).catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to paste from clipboard'
        });
      });
    }
  }

  loadSampleMarkdown(): void {
    this.inputText = `# Markdown Preview Sample

## Introduction
This is a **sample markdown document** to demonstrate the *Markdown Preview* functionality.

### Features
- Real-time preview
- Support for all standard Markdown syntax
- Code highlighting
- Tables and lists

### Code Example
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Table Example
| Feature | Supported |
|---------|-----------|
| Headers | ✅ |
| Lists | ✅ |
| Code | ✅ |
| Tables | ✅ |
| Links | ✅ |

### Links and Images
- [GitHub](https://github.com)
- [Markdown Guide](https://www.markdownguide.org)

> This is a blockquote example.
> It can span multiple lines.

---

**Bold text** and *italic text* and \`inline code\`.

1. Numbered list item 1
2. Numbered list item 2
3. Numbered list item 3

- Bullet point 1
- Bullet point 2
  - Nested bullet point
  - Another nested point`;

    this.renderMarkdown();
    this.messageService.add({
      severity: 'info',
      summary: 'Sample loaded',
      detail: 'Sample Markdown content loaded'
    });
  }

  clearText(): void {
    this.inputText = '';
    this.renderMarkdown();
    this.messageService.add({
      severity: 'info',
      summary: 'Cleared',
      detail: 'Editor content cleared'
    });
  }

  /**
   * Initialize editor options
   */
  private initializeEditorOptions() {
    this.editorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'markdown');
  }

  updateEditorTheme(): void {
    if (this.isBrowser && this.monacoEditor?._editor) {
      const monaco = (window as any).monaco;
      if (monaco) {
        monaco.editor.setTheme(this.editorTheme);
      }
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    setTimeout(() => {
      if (this.monacoEditor?._editor) {
        this.monacoEditor._editor.layout();
      }
    }, 100);
  }

  togglePreviewFullscreen(): void {
    this.isPreviewFullscreen = !this.isPreviewFullscreen;
  }

  scrollToCheatsheet(): void {
    if (this.isBrowser) {
      const element = document.getElementById('markdown-cheatsheet');
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isFullscreen) {
      this.toggleFullscreen();
      event.preventDefault();
    } else if (this.isPreviewFullscreen) {
      this.togglePreviewFullscreen();
      event.preventDefault();
    }
  }
} 