import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { RouterModule } from '@angular/router';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

@Component({
  selector: 'app-markdown-preview',
  standalone: true,
  imports: [
    FormsModule,
    MonacoEditorLazyComponent,
    ButtonModule,
    ToastModule,
    PageHeaderComponent,
    IconsModule,
    RouterModule,
    AnchorHeadingDirective,
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
    // Initial render; further updates are driven by (ngModelChange) handlers.
    this.renderMarkdown();
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/markdown-preview';
    const shortDescription = 'Free online Markdown preview tool. Write Markdown and see instant HTML rendering with CommonMark and GitHub Flavored Markdown support. 100% client-side.';

    const metaData: MetaData = {
      OgTitle: 'Markdown Preview - Free Online Markdown Editor & Live Renderer | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'markdown preview', 'markdown editor', 'markdown to html',
        'markdown renderer', 'online markdown viewer', 'live markdown preview',
        'commonmark preview', 'github flavored markdown', 'gfm preview',
        'markdown converter', 'documentation tool', 'readme preview',
        'markdown viewer online', 'free markdown editor'
      ],
      jsonLd: {
        name: 'Markdown Preview - Free Online Markdown Editor & Live Renderer',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Live Markdown to HTML rendering as you type',
          'Full CommonMark and GitHub Flavored Markdown (GFM) support',
          'Syntax highlighting with Monaco editor',
          'Tables, task lists, strikethrough and autolinks',
          'Copy Markdown source or rendered HTML to clipboard',
          'Paste from clipboard and load sample content',
          'Fullscreen distraction-free editing and preview',
          'Client-side processing for privacy - works offline'
        ]
      },
      faq: [
        {
          question: 'Is this Markdown preview tool free to use?',
          answer: "Yes. It's completely free, requires no sign-up and has no usage limits or ads."
        },
        {
          question: 'Do you store the Markdown I paste?',
          answer: 'No. All rendering happens locally in your browser - your Markdown is never uploaded to any server.'
        },
        {
          question: 'Which Markdown flavor is supported?',
          answer: 'The previewer supports the full CommonMark specification plus GitHub Flavored Markdown (GFM) extensions such as tables, task lists, strikethrough and autolinks.'
        },
        {
          question: 'Can I copy the rendered HTML?',
          answer: 'Yes. Use the Copy button to save the Markdown source, or select the rendered preview area and copy it as HTML into any CMS, email client or documentation tool.'
        },
        {
          question: 'Does it work offline?',
          answer: 'Yes. Once the page is loaded, the parser and editor run fully in your browser, so you can keep writing and previewing without an internet connection.'
        },
        {
          question: 'Is the preview sanitized against XSS?',
          answer: "The rendered HTML is injected through Angular's DomSanitizer and is only displayed inside your own browser tab. Because nothing is sent to a server and nothing is shared with other users, there is no cross-user XSS surface."
        },
        {
          question: 'Can I use it for large documents?',
          answer: "Yes. The Monaco editor and marked parser handle long README files and multi-thousand-line documents comfortably, limited only by your browser's memory."
        },
        {
          question: 'Will the rendered HTML look the same on GitHub?',
          answer: "Very close - this tool uses CommonMark + GFM, which is the same baseline GitHub uses. Minor visual differences may come from GitHub's own CSS and their server-side sanitizer, but the HTML structure matches."
        }
      ],
      howTo: {
        name: 'How to preview Markdown online',
        description: 'Write Markdown and see instant HTML rendering in your browser in three steps.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste or write Markdown',
            text: 'Paste your Markdown into the left editor, or click the Sample button to load an example document. The editor supports syntax highlighting, line numbers and word wrap.',
            url: pageUrl + '#input'
          },
          {
            name: 'Toggle options',
            text: 'Use the toolbar to paste from clipboard, copy the source, clear the editor, or expand into fullscreen mode for distraction-free writing. The preview renders live with CommonMark and GFM.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy HTML or download',
            text: 'Copy the Markdown source to your clipboard with the Copy button, or select the rendered preview area to copy the generated HTML into a CMS, email or documentation tool.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Text Tools', url: 'https://onlinewebdevtools.com/#text-tools' },
        { name: 'Markdown Preview', url: pageUrl }
      ]
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
  onEscapeKey(event: Event): void {
    if (this.isFullscreen) {
      this.toggleFullscreen();
      event.preventDefault();
    } else if (this.isPreviewFullscreen) {
      this.togglePreviewFullscreen();
      event.preventDefault();
    }
  }
} 