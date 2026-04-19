import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

interface WordCount {
  word: string;
  count: number;
}

@Component({
  selector: 'app-word-counter',
  standalone: true,
  imports: [
    FormsModule,
    MonacoEditorLazyComponent,
    BadgeModule,
    ButtonModule,
    ToastModule,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule,
],
  providers: [MessageService],
  templateUrl: './word-counter.component.html',
  styleUrl: './word-counter.component.scss'
})
export class WordCounterComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'dt-page';
  
  inputText: string = '';
  
  @ViewChild('monacoEditor') monacoEditor: any;
  
  editorTheme: string = 'vs-dark';
  
  editorOptions: any;

  isBrowser: boolean = false;
  isFullscreen: boolean = false;

  // Statistics
  totalWords: number = 0;
  totalCharacters: number = 0;
  wordDistribution: WordCount[] = [];
  
  private decorations: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private messageService: MessageService,
    private monacoConfigService: MonacoConfigService
  ) {
    this.pageTitleService.setTitle('Word Counter');
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Initialize editor options
    this.editorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext');
    this.editorOptions.wordWrap = 'on'; // Add word wrap for text analysis

    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }
  }

  ngOnInit() {
    this.setupSeo();
  }

  ngAfterViewInit(): void {
    // Initial pass; further updates are driven by (ngModelChange) via onTextChange().
    this.analyzeText();
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/word-counter';
    const shortDescription = 'Free online word counter and text analysis tool. Count words and characters, view word frequency distribution, and analyze your text instantly in your browser. No signup, no upload.';

    const metaData: MetaData = {
      OgTitle: 'Word Counter - Online Text & Word Count Tool | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'word counter',
        'online word counter',
        'count words',
        'character counter',
        'text analyzer',
        'word frequency',
        'keyword density',
        'word count tool',
        'text statistics',
        'word distribution',
        'text analytics',
        'content analysis',
        'essay word counter',
        'blog word count'
      ],
      jsonLd: {
        name: 'Word Counter - Online Text & Word Count Tool',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Real-time word and character counting',
          'Word frequency distribution (keyword density)',
          'Interactive word highlighting in the editor',
          'Sample text and clipboard paste support',
          'Copy analyzed text to clipboard',
          'Fullscreen editor for long documents',
          '100% client-side processing for privacy'
        ]
      },
      faq: [
        {
          question: 'Is this Word Counter free to use?',
          answer: "Yes, it's completely free with no registration, ads, or usage limits."
        },
        {
          question: 'Do you store my text?',
          answer: 'No, all processing happens locally in your browser. Your text never touches our servers.'
        },
        {
          question: 'How are words counted?',
          answer: 'The tool lowercases your text, replaces punctuation with spaces, splits on whitespace and counts each non-empty token as a word.'
        },
        {
          question: 'Can I analyze large documents?',
          answer: "Yes, the Monaco-based editor handles long texts efficiently, limited only by your browser's memory."
        },
        {
          question: 'What is the word distribution list?',
          answer: 'It is a frequency table that shows every unique word and how many times it appears in your text, sorted from the most to the least frequent.'
        },
        {
          question: 'Can I use this tool for SEO keyword density?',
          answer: 'Yes. The word frequency distribution works as a simple keyword density indicator, helping you see which terms dominate your content.'
        },
        {
          question: 'Does the Word Counter work offline?',
          answer: 'Yes. After the page loads, all counting and analysis runs in your browser, so it continues to work without an active internet connection.'
        }
      ],
      howTo: {
        name: 'How to count words online',
        description: 'Analyze any text and view live word, character and frequency statistics in three steps.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste or type your text',
            text: 'Paste your content into the Input Text editor, type directly, or click the Sample button to load example text. The editor supports large documents and fullscreen mode.',
            url: pageUrl + '#input'
          },
          {
            name: 'Configure counting',
            text: 'Watch the Text Statistics panel header - word and character counts refresh in real time as you edit, so there is nothing to configure manually.',
            url: pageUrl + '#options'
          },
          {
            name: 'View statistics and word distribution',
            text: 'Review total words and characters, then scroll the word frequency list. Hover a word to highlight every occurrence inside the editor.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Text Tools', url: 'https://onlinewebdevtools.com/#text-tools' },
        { name: 'Word Counter', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }

  analyzeText(): void {
    if (!this.inputText) {
      this.totalWords = 0;
      this.totalCharacters = 0;
      this.wordDistribution = [];
      return;
    }

    // Count characters
    this.totalCharacters = this.inputText.length;

    // Count words and create distribution
    const words = this.inputText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace non-word characters with spaces
      .split(/\s+/)
      .filter(word => word.length > 0);

    this.totalWords = words.length;

    // Create word frequency map
    const wordMap = new Map<string, number>();
    words.forEach(word => {
      wordMap.set(word, (wordMap.get(word) || 0) + 1);
    });

    // Convert to array and sort by frequency
    this.wordDistribution = Array.from(wordMap.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }

  onTextChange(): void {
    this.analyzeText();
  }

  highlightWord(word: string): void {
    if (!this.isBrowser || !this.monacoEditor?._editor) return;

    const editor = this.monacoEditor._editor;
    const model = editor.getModel();
    if (!model) return;

    const monaco = (window as any).monaco;
    if (!monaco) return;

    // Clear previous decorations
    this.decorations = editor.deltaDecorations(this.decorations, []);

    const text = model.getValue();
    const decorations: any[] = [];
    
    // Find all occurrences of the word (case insensitive)
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const startPos = model.getPositionAt(match.index);
      const endPos = model.getPositionAt(match.index + match[0].length);
      decorations.push({
        range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
        options: { 
          className: 'word-highlight',
          inlineClassName: 'word-highlight-inline'
        }
      });
    }
    this.decorations = editor.deltaDecorations(this.decorations, decorations);
  }

  clearHighlight(): void {
    if (!this.isBrowser || !this.monacoEditor?._editor) return;

    const editor = this.monacoEditor._editor;
    this.decorations = editor.deltaDecorations(this.decorations, []);
  }

  copyToClipboard(): void {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.writeText(this.inputText).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Text copied to clipboard'
        });
      });
    }
  }

  pasteFromClipboard(): void {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.readText().then(text => {
        this.inputText = text;
        this.analyzeText();
      });
    }
  }

  loadSampleText(): void {
    this.inputText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`;
    
    this.analyzeText();
  }

  clearText(): void {
    this.inputText = '';
    this.analyzeText();
    this.clearHighlight();
  }

  updateEditorTheme(): void {
    if (this.isBrowser) {
      this.editorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext');
      this.editorOptions.wordWrap = 'on'; // Add word wrap for text analysis
    }
  }

  toggleFullscreen(): void {
    if (!this.isBrowser) return;

    this.isFullscreen = !this.isFullscreen;
    
    setTimeout(() => {
      if (this.monacoEditor?.editor) {
        this.monacoEditor.editor.layout();
      }
    }, 100);
  }

  trackByWord(index: number, item: WordCount): string {
    return item.word;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.isFullscreen) {
      this.toggleFullscreen();
      event.preventDefault();
    }
  }
} 
