import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, ElementRef, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { SeoService, MetaData } from '../../services/seo.service';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { diff_match_patch, DIFF_EQUAL, DIFF_DELETE, DIFF_INSERT } from 'diff-match-patch';
import { RouterModule } from '@angular/router';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

@Component({
  selector: 'app-text-compare',
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
  templateUrl: './text-compare.component.html',
  styleUrl: './text-compare.component.scss'
})
export class TextCompareComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') class = 'dt-page';
  originalText: string = '';
  modifiedText: string = '';

  @ViewChild('originalMonacoEditor') originalMonacoEditor: any;
  @ViewChild('modifiedMonacoEditor') modifiedMonacoEditor: any;
  @ViewChild('originalEditorContainer') originalEditorContainer!: ElementRef;
  @ViewChild('modifiedEditorContainer') modifiedEditorContainer!: ElementRef;


  editorTheme: string = 'vs-dark';

  originalEditorOptions: any;

  modifiedEditorOptions: any;

  isBrowser: boolean = false;

  isOriginalFullscreen: boolean = false;
  isModifiedFullscreen: boolean = false;



  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private seoService: SeoService,
    private messageService: MessageService,
    private monacoConfigService: MonacoConfigService
  ) {
    this.pageTitleService.setTitle('Text Diff Checker');
    
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
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event) {
    if (this.isOriginalFullscreen || this.isModifiedFullscreen) {
      this.isOriginalFullscreen = false;
      this.isModifiedFullscreen = false;
      
      setTimeout(() => {
        if (this.originalMonacoEditor?.editor) {
          this.originalMonacoEditor.editor.layout();
        }
        if (this.modifiedMonacoEditor?.editor) {
          this.modifiedMonacoEditor.editor.layout();
        }
      }, 100);
    }
  }

  private decorationsOrig: string[] = [];
  private decorationsMod: string[] = [];

  // Результаты сравнения
  comparisonResult: {
    hasChanges: boolean;
    totalChanges: number;
  } = {
    hasChanges: false,
    totalChanges: 0
  };

  ngAfterViewInit(): void {
    //setTimeout(() => this.applyInlineDiffs(), 500);
  }

  applyInlineDiffs(): void {
    // Сброс результатов
    this.comparisonResult = {
      hasChanges: false,
      totalChanges: 0
    };

    // Проверяем, что мы в браузере и редакторы загружены
    if (!this.isBrowser || !this.originalMonacoEditor || !this.modifiedMonacoEditor) {
      this.generateComparisonResult();
      return;
    }

    const originalEditor = this.originalMonacoEditor._editor;
    const modifiedEditor = this.modifiedMonacoEditor._editor;

    if (!originalEditor || !modifiedEditor) {
      this.generateComparisonResult();
      return;
    }

    const originalModel = originalEditor.getModel();
    const modifiedModel = modifiedEditor.getModel();

    if (!originalModel || !modifiedModel) {
      this.generateComparisonResult();
      return;
    }

    const dmp = new diff_match_patch();
    const decorationsOrig: any[] = [];
    const decorationsMod: any[] = [];

    const originalLines = originalModel.getLinesContent();
    const modifiedLines = modifiedModel.getLinesContent();

    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[i] || '';
      
      const diffs = dmp.diff_main(origLine, modLine);
      dmp.diff_cleanupSemantic(diffs);

      let hasChanges = false;
      let hasInsertions = false;
      let hasDeletions = false;

      // Проверяем, есть ли изменения в строке
      for (const [op] of diffs) {
        if (op === DIFF_DELETE) {
          hasChanges = true;
          hasDeletions = true;
        } else if (op === DIFF_INSERT) {
          hasChanges = true;
          hasInsertions = true;
        }
      }

      // Анализируем изменения для отчета
      if (hasChanges) {
        this.addChangeToResult();
      }

      // Получаем monaco из глобального объекта (ngx-monaco-editor загружает его глобально)
      const monaco = (window as any).monaco;
      if (!monaco) continue;

      // Добавляем подсветку всей строки, если есть изменения
      if (hasChanges && hasDeletions && origLine) {
        decorationsOrig.push({
          range: new monaco.Range(i + 1, 1, i + 1, 1),
          options: { 
            isWholeLine: true,
            className: 'line-deleted'
          }
        });
      }

      if (hasChanges && hasInsertions && modLine) {
        decorationsMod.push({
          range: new monaco.Range(i + 1, 1, i + 1, 1),
          options: { 
            isWholeLine: true,
            className: 'line-inserted'
          }
        });
      }

      // Добавляем подсветку конкретных изменений
      let origCol = 1;
      let modCol = 1;

      for (const [op, data] of diffs) {
        const len = data.length;

        if (op === DIFF_DELETE) {
          decorationsOrig.push({
            range: new monaco.Range(i + 1, origCol, i + 1, origCol + len),
            options: { inlineClassName: 'inline-delete' }
          });
          origCol += len;
        } else if (op === DIFF_INSERT) {
          decorationsMod.push({
            range: new monaco.Range(i + 1, modCol, i + 1, modCol + len),
            options: { inlineClassName: 'inline-insert' }
          });
          modCol += len;
        } else {
          origCol += len;
          modCol += len;
        }
      }
    }

    this.decorationsOrig = originalEditor.deltaDecorations(this.decorationsOrig, decorationsOrig);
    this.decorationsMod = modifiedEditor.deltaDecorations(this.decorationsMod, decorationsMod);

    // Финализируем результат сравнения
    this.comparisonResult.hasChanges = this.comparisonResult.totalChanges > 0;
  }

  private generateComparisonResult(): void {
    // Простое сравнение для случаев без Monaco
    const originalText = this.originalText.trim();
    const modifiedText = this.modifiedText.trim();
    
    if (originalText !== modifiedText) {
      this.comparisonResult = {
        hasChanges: true,
        totalChanges: 1
      };
    }
  }

  private addChangeToResult(): void {
    // Простое инкрементирование количества изменений
    this.comparisonResult.totalChanges++;
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/text-diff-checker';
    const shortDescription = 'Free online text diff checker. Compare two texts side by side with inline, character-level highlighting of insertions, deletions and modifications - 100% in your browser.';

    const metaData: MetaData = {
      OgTitle: 'Text Diff Checker - Compare Text Online | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: ['text diff checker', 'text compare', 'compare text online', 'text diff',
        'diff tool', 'diff viewer', 'compare two texts', 'text difference',
        'side by side diff', 'inline diff', 'online diff checker', 'text comparison tool',
        'file comparison', 'code diff online'],
      jsonLd: {
        name: 'Text Diff Checker - Compare Text Online | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Side-by-side comparison of Original and Modified texts',
          'Inline character-level highlighting of insertions and deletions',
          'Whole-line change markers for quickly locating modifications',
          'Monaco-powered editors with syntax highlighting and line numbers',
          'Fullscreen editing mode for each side with Esc to exit',
          'Sample data loader and one-click Copy / Paste / Clear actions',
          'Dark and light editor themes',
          'Client-side processing for privacy - no data leaves your browser'
        ]
      },
      faq: [
        {
          question: 'Is this Text Diff Checker free to use?',
          answer: "Yes, it's completely free with no registration, ads, or usage limits."
        },
        {
          question: 'Do you store the texts I compare?',
          answer: 'No. All diff computation happens locally in your browser - your original and modified texts never leave your machine.'
        },
        {
          question: 'What diff algorithm does this tool use?',
          answer: "The tool uses Google's diff-match-patch library, a Myers-style diff implementation with semantic cleanup that produces readable character-level and line-level diffs."
        },
        {
          question: 'Can I compare source code and configuration files?',
          answer: 'Yes. The Monaco-powered editors handle code, JSON, YAML, XML, Markdown, and any plain text. Just paste both versions and the differences are highlighted automatically.'
        },
        {
          question: 'Can I compare large text files?',
          answer: "Yes. The tool handles large documents efficiently, limited mainly by your browser's available memory. For very large files, splitting them into smaller sections often improves readability of the diff."
        },
        {
          question: 'How are insertions and deletions highlighted?',
          answer: 'Deleted content is highlighted in the Original (left) editor, inserted content is highlighted in the Modified (right) editor, and modified lines are additionally marked with whole-line backgrounds for quick scanning.'
        },
        {
          question: 'Does it work offline?',
          answer: 'Once the page has loaded, comparison runs entirely in your browser, so you can keep using it even on restricted or offline networks.'
        }
      ],
      howTo: {
        name: 'How to compare two texts online',
        description: 'Find differences between two texts in three steps using the Text Diff Checker.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste the Original text',
            text: 'Paste your original text into the left editor, or click the Sample button to load an example.',
            url: pageUrl + '#input'
          },
          {
            name: 'Paste the Modified text and pick mode',
            text: 'Paste the updated version into the right editor and use the toolbar actions (Sample, Paste, Clear, Fullscreen) to configure how you view the comparison.',
            url: pageUrl + '#options'
          },
          {
            name: 'Review the highlighted differences',
            text: 'Review inline character-level and whole-line diffs in both editors, and check the Comparison Results summary for the total number of changes detected.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Text Tools', url: 'https://onlinewebdevtools.com/#text-tools' },
        { name: 'Text Diff Checker', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }


  copyOriginalToClipboard() {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.writeText(this.originalText).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Original text copied to clipboard'
        });
      });
    }
  }

  copyModifiedToClipboard() {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.writeText(this.modifiedText).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Modified text copied to clipboard'
        });
      });
    }
  }

  pasteToOriginal() {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.readText().then(text => {
        this.originalText = text;
        this.applyInlineDiffs();
      });
    }
  }

  pasteToModified() {
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.readText().then(text => {
        this.modifiedText = text;
        this.applyInlineDiffs();
      });
    }
  }

  loadSampleText() {
    this.originalText = `function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 3);
console.log(result);
//TODO fix that`;

    this.modifiedText = `function calculateSum(a, b, c = 0) {
  return a + b + c;
}

const result = calculateSum(5, 3, 2);
console.log('Result:', result);`;

    this.applyInlineDiffs();
  }

  clearTexts() {
    this.originalText = '';
    this.modifiedText = '';
    this.comparisonResult = {
      hasChanges: false,
      totalChanges: 0
    };
    if (this.isBrowser) {
      this.applyInlineDiffs();
    }
  }

  updateEditorTheme() {
    this.originalEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext');
    this.modifiedEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext');
  }

  /**
   * Initialize editor options
   */
  private initializeEditorOptions() {
    this.originalEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext');
    this.modifiedEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'plaintext');
  }

  onTextChange() {
    this.applyInlineDiffs();
    // this.updateDiffEditor();
  }


  toggleFullscreen(editorType: 'original' | 'modified' | 'diff') {
    if (!this.isBrowser) return;

    if (editorType === 'original') {
      this.isOriginalFullscreen = !this.isOriginalFullscreen;
      if (this.isOriginalFullscreen) {
        this.isModifiedFullscreen = false;
      }
    } else if (editorType === 'modified') {
      this.isModifiedFullscreen = !this.isModifiedFullscreen;
      if (this.isModifiedFullscreen) {
        this.isOriginalFullscreen = false;
      }
    }

    
    setTimeout(() => {
      if (editorType === 'original' && this.originalMonacoEditor?.editor) {
        this.originalMonacoEditor.editor.layout();
      } else if (editorType === 'modified' && this.modifiedMonacoEditor?.editor) {
        this.modifiedMonacoEditor.editor.layout();
      }
    }, 100);
  }
} 