import { Component, OnInit, PLATFORM_ID, Inject, effect, ViewChild, AfterViewInit, OnDestroy, HostBinding, ElementRef, HostListener } from '@angular/core';
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
import { diff_match_patch, DIFF_EQUAL, DIFF_DELETE, DIFF_INSERT } from 'diff-match-patch';

@Component({
  selector: 'app-text-compare',
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

  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'Text Diff Checker - Online Text Compare Tool | DevTools',
      OgDescription: 'Free online text diff checker tool. Compare two text files side by side with highlighted differences and detailed diff view.',
      description: 'Text diff checker and compare tool online. Highlight differences between two texts, view side-by-side comparison, and analyze changes with detailed diff visualization. Free text compare utility.',
      keywords: ['text diff checker', 'text compare', 'text diff', 'file comparison', 'text difference', 'side by side comparison', 'text analysis', 'diff tool'],
      jsonLd: {
        name: 'Text Diff Checker - Online Text Compare Tool',
        description: 'Online text diff checker to compare and diff text files with highlighted differences',
        url: 'https://onlinewebdevtools.com/text-diff-checker'
      }
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