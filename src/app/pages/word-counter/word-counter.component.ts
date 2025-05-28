import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { MonacoScrollFixDirective } from '../../shared/directives/monaco-scroll-fix.directive';

interface WordCount {
  word: string;
  count: number;
}

@Component({
  selector: 'app-word-counter',
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
    setTimeout(() => this.analyzeText(), 500);
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'Word Counter - Online Text Analysis Tool | DevTools',
      OgDescription: 'Free online word counter and text analysis tool. Count words, characters, and analyze word frequency distribution in your text.',
      description: 'Online word counter tool to count words, characters, and analyze text statistics. View word frequency distribution and detailed text analysis. Free text analytics utility.',
      keywords: ['word counter', 'text analysis', 'character counter', 'word frequency', 'text statistics', 'word distribution', 'text analytics', 'content analysis'],
      jsonLd: {
        name: 'Word Counter - Online Text Analysis Tool',
        description: 'Online word counter and text analysis tool with word frequency distribution',
        url: 'https://onlinewebdevtools.com/word-counter'
      }
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
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isFullscreen) {
      this.toggleFullscreen();
      event.preventDefault();
    }
  }
} 