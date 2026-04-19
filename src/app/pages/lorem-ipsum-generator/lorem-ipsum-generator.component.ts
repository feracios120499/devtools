import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { MonacoScrollFixDirective } from '../../shared/directives/monaco-scroll-fix.directive';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';

type LoremType = 'paragraphs' | 'sentences' | 'words';

@Component({
  selector: 'app-lorem-ipsum-generator',
  standalone: true,
  imports: [
    FormsModule,
    MonacoEditorModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule,
    MonacoScrollFixDirective
],
  providers: [MessageService],
  templateUrl: './lorem-ipsum-generator.component.html',
  styleUrl: './lorem-ipsum-generator.component.scss'
})
export class LoremIpsumGeneratorComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'dt-page';
  
  outputText: string = '';
  count: number = 5;
  loremType: LoremType = 'paragraphs';
  
  @ViewChild('monacoEditor') monacoEditor: any;
  
  editorTheme: string = 'vs-dark';
  
  editorOptions = {
    theme: this.editorTheme,
    language: 'plaintext',
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
    fixedOverflowWidgets: true,
    readOnly: false
  };

  isBrowser: boolean = false;
  isFullscreen: boolean = false;

  // Lorem ipsum base words for generation
  private loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos',
    'accusamus', 'accusantium', 'doloremque', 'laudantium', 'totam', 'rem',
    'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis',
    'et', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta', 'sunt', 'explicabo',
    'nemo', 'ipsam', 'voluptatem', 'quia', 'voluptas', 'aspernatur', 'aut',
    'odit', 'fugit', 'sed', 'quia', 'consequuntur', 'magni', 'dolores', 'ratione',
    'sequi', 'nesciunt', 'neque', 'porro', 'quisquam', 'dolorem', 'adipisci',
    'numquam', 'eius', 'modi', 'tempora', 'incidunt', 'magnam', 'quaerat'
  ];

  loremTypeOptions = [
    { label: 'Paragraphs', value: 'paragraphs' as LoremType },
    { label: 'Sentences', value: 'sentences' as LoremType },
    { label: 'Words', value: 'words' as LoremType }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private monacoConfigService: MonacoConfigService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private messageService: MessageService
  ) {
    this.pageTitleService.setTitle('Lorem Ipsum Generator');
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Initialize editor options
    this.initializeEditorOptions();

    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }
  }

  ngOnInit() {
    this.setupSeo();
    this.generateLorem();
  }

  ngAfterViewInit(): void {
    //setTimeout(() => this.generateLorem(), 500);
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'Lorem Ipsum Generator - Online Placeholder Text Tool | DevTools',
      OgDescription: 'Free online Lorem Ipsum generator. Create placeholder text in paragraphs, sentences, or words. Perfect for design mockups and content development.',
      description: 'Online Lorem Ipsum generator tool to create placeholder text in various formats. Generate paragraphs, sentences, or individual words for design and development needs.',
      keywords: ['lorem ipsum', 'placeholder text', 'dummy text', 'text generator', 'design mockup', 'content placeholder', 'lorem generator', 'filler text'],
      jsonLd: {
        name: 'Lorem Ipsum Generator - Online Placeholder Text Tool',
        description: 'Online Lorem Ipsum generator for creating placeholder text in multiple formats',
        url: 'https://onlinewebdevtools.com/lorem-ipsum-generator'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }

  generateLorem(): void {
    switch (this.loremType) {
      case 'paragraphs':
        this.outputText = this.generateParagraphs(this.count);
        break;
      case 'sentences':
        this.outputText = this.generateSentences(this.count);
        break;
      case 'words':
        this.outputText = this.generateWords(this.count);
        break;
    }
  }

  private generateWords(count: number): string {
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      words.push(this.getRandomWord());
    }
    return words.join(' ');
  }

  private generateSentences(count: number): string {
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) {
      const sentenceLength = Math.floor(Math.random() * 15) + 8; // 8-22 words per sentence
      const words: string[] = [];
      for (let j = 0; j < sentenceLength; j++) {
        words.push(this.getRandomWord());
      }
      // Capitalize first word and add period
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      sentences.push(words.join(' ') + '.');
    }
    return sentences.join(' ');
  }

  private generateParagraphs(count: number): string {
    const paragraphs: string[] = [];
    for (let i = 0; i < count; i++) {
      const sentenceCount = Math.floor(Math.random() * 5) + 3; // 3-7 sentences per paragraph
      const sentences: string[] = [];
      for (let j = 0; j < sentenceCount; j++) {
        const sentenceLength = Math.floor(Math.random() * 15) + 8; // 8-22 words per sentence
        const words: string[] = [];
        for (let k = 0; k < sentenceLength; k++) {
          words.push(this.getRandomWord());
        }
        // Capitalize first word and add period
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        sentences.push(words.join(' ') + '.');
      }
      paragraphs.push(sentences.join(' '));
    }
    return paragraphs.join('\n');
  }

  private getRandomWord(): string {
    return this.loremWords[Math.floor(Math.random() * this.loremWords.length)];
  }

  onCountChange(): void {
    if (this.count < 1) this.count = 1;
    if (this.count > 100) this.count = 100;
    this.generateLorem();
  }

  onTypeChange(): void {
    this.generateLorem();
  }

  copyToClipboard(): void {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.writeText(this.outputText).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied',
          detail: 'Lorem ipsum text copied to clipboard'
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

  downloadText(): void {
    if (!this.isBrowser) return;

    const blob = new Blob([this.outputText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lorem-ipsum-${this.loremType}-${this.count}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Downloaded',
      detail: 'Lorem ipsum text file downloaded'
    });
  }

  clearText(): void {
    this.outputText = '';
    this.messageService.add({
      severity: 'info',
      summary: 'Cleared',
      detail: 'Editor content cleared'
    });
  }

  updateEditorTheme(): void {
    this.editorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80
    };
    
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

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.isFullscreen) {
      this.toggleFullscreen();
      event.preventDefault();
    }
  }

  /**
   * Initialize editor options
   */
  private initializeEditorOptions(): void {
    this.editorOptions = {
      ...this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext'),
      wordWrap: 'on',
      wordWrapColumn: 80
    };
  }
} 