import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, Renderer2, HostBinding, effect, ViewChild, ElementRef, HostListener, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../services/theme.service';
import { MonacoConfigService } from '../../services/monaco-config.service';
import { PageTitleService } from '../../services/page-title.service';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { MonacoEditorLazyComponent } from '../../shared/components/monaco-editor-lazy/monaco-editor-lazy.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { IconsModule } from '../../shared/modules/icons.module';
import { SeoService, MetaData } from '../../services/seo.service';
import { RouterModule } from '@angular/router';
import { AnchorHeadingDirective } from '../../directives/anchor-heading.directive';

// Интерфейс для сохранения настроек страницы
export interface SvgToReactSettings {
  componentName: string;
  useTypescript: boolean;
  useProps: boolean;
  useArrowFunction: boolean;
}

@Component({
  selector: 'app-svg-to-react-component',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    ToastModule,
    MonacoEditorLazyComponent,
    PageHeaderComponent,
    IconsModule,
    AnchorHeadingDirective,
    RouterModule,
],
  providers: [MessageService],
  templateUrl: './svg-to-react-component.component.html',
  styleUrl: './svg-to-react-component.component.scss'
})
export class SvgToReactComponentComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';

  // Literal code examples used in SEO content (avoid Angular's ICU/interpolation parser)
  readonly jsxStyleExample: string = 'style={{ color: "red" }}';
  readonly jsxSpreadPropsExample: string = '{...props}';

  // Настройки компонента
  componentName: string = 'SvgIcon';
  useTypescript: boolean = true;
  useProps: boolean = true;
  useArrowFunction: boolean = false;

  // Тема редактора
  editorTheme: string = 'vs-dark'; // Default theme

  // Ссылки на редакторы
  @ViewChild('inputMonacoEditor') inputMonacoEditor: any;
  @ViewChild('outputMonacoEditor') outputMonacoEditor: any;
  @ViewChild('inputEditorContainer') inputEditorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;

  // Настройки редакторов
  svgEditorOptions = {
    theme: this.editorTheme,
    language: 'xml',
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on'
  };

  reactEditorOptions = {
    theme: this.editorTheme,
    language: 'typescript',
    automaticLayout: true,
    readOnly: true,
    minimap: { enabled: false }
  };

  // Содержимое редакторов
  svgCode: string = '';
  reactCode: string = '';

  // Флаг для проверки окружения (браузер или сервер)
  isBrowser: boolean = false;
  
  // Флаги для отображения полноэкранных редакторов
  isInputFullscreen: boolean = false;
  isOutputFullscreen: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private themeService: ThemeService,
    private monacoConfigService: MonacoConfigService,
    private pageTitleService: PageTitleService,
    private metaService: Meta,
    private titleService: Title,
    private messageService: MessageService,
    private userPreferencesService: UserPreferencesService,
    private seoService: SeoService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Initialize editor options
    this.initializeEditorOptions();
    
    // Реагируем на изменения темы в приложении, только в браузере
    if (this.isBrowser) {
      effect(() => {
        this.editorTheme = this.themeService.getMonacoTheme();
        this.updateEditorTheme();
      });
    }
  }

  ngOnInit() {
    // Установка заголовка страницы
    this.pageTitleService.setTitle('SVG to React Component');
    
    // Настройка SEO
    this.setupSeo();
    
    // Загружаем сохраненные настройки
    this.loadSettings();
    
    // Инициализируем пример SVG, если нет данных
    if (!this.svgCode) {
      this.svgCode = this.getExampleSvg();
      this.convertSvgToReact();
    }
  }

  ngOnDestroy() {
    // Очищаем SEO элементы
    this.seoService.destroy();
  }
  
  /**
   * Initialize editor options
   */
  private initializeEditorOptions() {
    this.svgEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'xml');
    this.svgEditorOptions.wordWrap = 'on'; // Add word wrap for text analysis
    this.reactEditorOptions = this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'typescript');
  }
  
  /**
   * Обновляет настройки редакторов при изменении темы
   */
  updateEditorTheme() {
    this.svgEditorOptions = this.monacoConfigService.getBaseEditorOptions(this.editorTheme, 'xml');
    this.reactEditorOptions = this.monacoConfigService.getReadOnlyEditorOptions(this.editorTheme, 'typescript');
  }

  /**
   * Configure page-level SEO via SeoService.
   * FAQ/HowTo texts must mirror the visible content (Google FAQ/HowTo rich-results requirement).
   */
  private setupSeo() {
    const pageUrl = 'https://onlinewebdevtools.com/svg-to-react-component';
    const shortDescription = 'Convert SVG to React components online. Free in-browser SVG to JSX/TSX converter with TypeScript typings, props injection, attribute casing and instant copy or download.';

    const metaData: MetaData = {
      OgTitle: 'SVG to React Component Converter (TSX & JSX) Online | DevTools',
      OgDescription: shortDescription,
      description: shortDescription,
      keywords: [
        'svg to react',
        'svg to react component',
        'svg to jsx',
        'svg to tsx',
        'react svg component generator',
        'convert svg to react',
        'svgr online',
        'svg react converter',
        'react icon component',
        'typescript svg component',
        'svg to react online',
        'jsx from svg'
      ],
      jsonLd: {
        name: 'SVG to React Component Converter (TSX & JSX) Online | DevTools',
        description: shortDescription,
        url: pageUrl,
        featureList: [
          'Convert SVG markup to React (TSX or JSX) components',
          'TypeScript typings via SVGProps<SVGSVGElement>',
          'Automatic kebab-case to camelCase JSX attribute conversion',
          'class → className and inline style-object transformation',
          'Optional props injection for width, height, fill and stroke',
          'Arrow function or default-export component styles',
          'Copy to clipboard and download as .tsx or .jsx',
          'Client-side only — SVGs never leave your browser'
        ]
      },
      faq: [
        {
          question: 'Is this SVG to React converter free to use?',
          answer: "Yes, it's completely free with no registration, ads, or usage limits."
        },
        {
          question: 'Do you upload or store my SVG files?',
          answer: 'No. All parsing and code generation happens locally in your browser — your SVG markup and the generated component never touch our servers.'
        },
        {
          question: 'Can I generate TypeScript (.tsx) components?',
          answer: 'Yes. Enable "Use TypeScript" to get a typed component with a Props interface that extends SVGProps<SVGSVGElement> and defaults for width, height, fill and stroke.'
        },
        {
          question: 'Does the tool convert SVG attributes to valid JSX?',
          answer: 'Absolutely. Kebab-case attributes like stroke-width are rewritten to strokeWidth, class becomes className, and inline style strings are turned into React style objects.'
        },
        {
          question: 'Can I pass custom props like color or size to the generated component?',
          answer: 'Yes. With props enabled, width, height, fill and stroke become component props, and {...props} is spread onto the root <svg> so you can forward any standard SVG attribute.'
        },
        {
          question: 'Can I use the output in Next.js or React Server Components?',
          answer: 'Yes. The generated component is a plain React function component with no runtime dependencies, so it works in Next.js (App or Pages Router), Vite, CRA, Remix and React Server Components.'
        },
        {
          question: 'What about complex SVGs with gradients, masks or filters?',
          answer: 'The converter preserves the full SVG tree, including <defs>, gradients, masks, clip-paths and filters. It only rewrites attributes and syntax — the visual output remains identical to the source SVG.'
        }
      ],
      howTo: {
        name: 'How to convert SVG to a React component online',
        description: 'Turn any SVG into a reusable React component in three steps, fully in your browser.',
        totalTime: 'PT1M',
        steps: [
          {
            name: 'Paste your SVG',
            text: 'Paste raw SVG markup into the SVG Input editor, or click the Sample button to load a demo icon. Conversion happens in real time.',
            url: pageUrl + '#input'
          },
          {
            name: 'Configure the component',
            text: 'Set the component name, choose TypeScript (.tsx) or JSX (.jsx), and toggle common props such as width, height, fill and stroke.',
            url: pageUrl + '#options'
          },
          {
            name: 'Copy or download the component',
            text: 'Copy the generated React component to your clipboard or download it as a ready-to-use .tsx or .jsx file.',
            url: pageUrl + '#output'
          }
        ]
      },
      breadcrumbs: [
        { name: 'Home', url: 'https://onlinewebdevtools.com/' },
        { name: 'Text Tools', url: 'https://onlinewebdevtools.com/#text-tools' },
        { name: 'SVG to React Component', url: pageUrl }
      ]
    };

    this.seoService.setupSeo(metaData);
  }

  /**
   * Загружает сохраненные настройки
   */
  private loadSettings() {
    const settings = this.userPreferencesService.loadPageSettings<SvgToReactSettings>('svg-to-react-component');
    if (settings) {
      this.componentName = settings.componentName || 'SvgIcon';
      this.useTypescript = settings.useTypescript !== undefined ? settings.useTypescript : true;
      this.useProps = settings.useProps !== undefined ? settings.useProps : true;
      this.useArrowFunction = settings.useArrowFunction !== undefined ? settings.useArrowFunction : false;
    }
  }

  /**
   * Сохраняет текущие настройки
   */
  private saveSettings() {
    const settings: SvgToReactSettings = {
      componentName: this.componentName,
      useTypescript: this.useTypescript,
      useProps: this.useProps,
      useArrowFunction: this.useArrowFunction
    };
    
    this.userPreferencesService.savePageSettings('svg-to-react-component', settings);
  }

  /**
   * Обработчик изменения настроек
   */
  onSettingsChange() {
    this.saveSettings();
    this.convertSvgToReact();
  }

  /**
   * Обработчик изменения SVG кода
   */
  onSvgCodeChange() {
    this.convertSvgToReact();
  }

  /**
   * Копирует сгенерированный React компонент в буфер обмена
   */
  copyReactCode() {
    if (this.isBrowser) {
      navigator.clipboard.writeText(this.reactCode).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied!',
          detail: 'React component copied to clipboard',
          life: 3000
        });
      }).catch(err => {
        console.error('Could not copy text: ', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy to clipboard',
          life: 3000
        });
      });
    }
  }
  
  /**
   * Вставляет SVG код из буфера обмена
   */
  pasteSvgFromClipboard() {
    if (this.isBrowser) {
      navigator.clipboard.readText().then((text) => {
        this.svgCode = text;
        this.convertSvgToReact();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Pasted!',
          detail: 'SVG code pasted from clipboard',
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
  }
  
  /**
   * Скачивает React компонент как файл
   */
  downloadReactComponent() {
    if (!this.isBrowser || !this.reactCode) return;
    
    try {
      // Определяем расширение файла на основе настроек
      const extension = this.useTypescript ? '.tsx' : '.jsx';
      const componentName = this.componentName || 'SvgComponent';
      
      // Создаем Blob и ссылку для загрузки
      const blob = new Blob([this.reactCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${componentName}${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: `Component saved as ${componentName}${extension}`,
        life: 3000
      });
    } catch (error) {
      console.error('Failed to download: ', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download the component',
        life: 3000
      });
    }
  }

  /**
   * Очищает редактор SVG
   */
  clearSvg() {
    this.svgCode = '';
    this.reactCode = '';
  }

  /**
   * Загружает пример SVG
   */
  loadExampleSvg() {
    this.svgCode = this.getExampleSvg();
    this.convertSvgToReact();
  }

  /**
   * Возвращает пример SVG кода
   */
  private getExampleSvg(): string {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  }

  /**
   * Преобразует SVG код в React компонент
   */
  private convertSvgToReact() {
    if (!this.svgCode.trim()) {
      this.reactCode = '';
      return;
    }

    try {
      // Парсим и очищаем SVG
      const cleanedSvg = this.cleanSvgCode(this.svgCode);
      
      // Извлекаем атрибуты svg
      const svgAttributes = this.extractSvgAttributes(this.svgCode);
      
      // Формируем код компонента
      this.reactCode = this.generateReactComponent(cleanedSvg, svgAttributes);
    } catch (error) {
      console.error('Error converting SVG:', error);
      this.reactCode = `// Error converting SVG: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  /**
   * Извлекает атрибуты из SVG-тега
   */
  private extractSvgAttributes(svg: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Регулярное выражение для поиска svg-тега и его атрибутов
    const svgTagRegex = /<svg\s([^>]*)>/i;
    const match = svg.match(svgTagRegex);
    
    if (match && match[1]) {
      // Регулярное выражение для извлечения атрибутов и их значений
      const attributeRegex = /([a-z0-9-:]+)=["']([^"']*)["']/gi;
      let attributeMatch;
      
      while ((attributeMatch = attributeRegex.exec(match[1])) !== null) {
        const [_, attributeName, attributeValue] = attributeMatch;
        attributes[attributeName] = attributeValue;
      }
    }
    
    // Проверяем на наличие атрибутов stroke/fill в дочерних элементах (path, circle и т.д.)
    // Это важно для случаев, когда stroke/fill задан только в path, но не в корневом svg
    const importantAttributes = ['stroke', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'];
    
    importantAttributes.forEach(attr => {
      if (!attributes[attr]) {
        // Ищем атрибут в любом дочернем элементе
        const attrRegex = new RegExp(`<[^>]+${attr}=["']([^"']*)["'][^>]*>`, 'i');
        const childMatch = svg.match(attrRegex);
        
        if (childMatch && childMatch[1]) {
          attributes[attr] = childMatch[1];
        }
      }
    });
    
    return attributes;
  }

  /**
   * Очищает и преобразует SVG код
   */
  private cleanSvgCode(svg: string): string {
    // Удаляем комментарии
    let cleaned = svg.replace(/<!--[\s\S]*?-->/g, '');
    
    // Преобразуем атрибуты style в стиль React
    cleaned = cleaned.replace(/style="([^"]*)"/g, (match, styleContent) => {
      const styleObj = styleContent.split(';')
        .filter(Boolean)
        .map((style: string) => {
          const [prop, value] = style.split(':').map((s: string) => s.trim());
          // Преобразуем kebab-case в camelCase
          const camelProp = prop.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
          return `"${camelProp}": "${value}"`;
        })
        .join(', ');
      
      return `style={{${styleObj}}}`;
    });
    
    // Преобразуем атрибуты в формат JSX
    // Обрабатываем атрибуты для любого элемента, не только для svg
    // Сначала обрабатываем stroke и fill в дочерних элементах, если используем props
    if (this.useProps) {
      // Заменяем атрибуты stroke и fill в любых элементах на динамические значения из пропсов
      cleaned = cleaned.replace(/stroke="([^"]*)"/gi, 'stroke={stroke}');
      cleaned = cleaned.replace(/fill="([^"]*)"/gi, 'fill={fill}');
      
      // Преобразуем kebab-case атрибуты в camelCase для stroke и fill
      cleaned = cleaned.replace(/stroke-width="([^"]*)"/gi, 'strokeWidth="$1"');
      cleaned = cleaned.replace(/stroke-linecap="([^"]*)"/gi, 'strokeLinecap="$1"');
      cleaned = cleaned.replace(/stroke-linejoin="([^"]*)"/gi, 'strokeLinejoin="$1"');
      cleaned = cleaned.replace(/fill-rule="([^"]*)"/gi, 'fillRule="$1"');
      cleaned = cleaned.replace(/fill-opacity="([^"]*)"/gi, 'fillOpacity="$1"');
      cleaned = cleaned.replace(/stroke-opacity="([^"]*)"/gi, 'strokeOpacity="$1"');
      cleaned = cleaned.replace(/stroke-dasharray="([^"]*)"/gi, 'strokeDasharray="$1"');
      cleaned = cleaned.replace(/stroke-dashoffset="([^"]*)"/gi, 'strokeDashoffset="$1"');
    }
    
    // Затем обрабатываем остальные атрибуты
    cleaned = cleaned.replace(/([a-z-]+)="([^"]*)"/gi, (match, attr, value) => {
      // Преобразуем kebab-case в camelCase для аттрибутов
      const camelAttr = attr.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
      
      // Обрабатываем специальные атрибуты
      if (camelAttr === 'class') return `className="${value}"`;
      if (camelAttr === 'for') return `htmlFor="${value}"`;
      
      // Если атрибут уже обработан (например, style)
      if (match.includes('{{')) return match;
      
      // Преобразуем некоторые атрибуты для использования с переменными
      if (this.useProps) {
        if (camelAttr === 'stroke') return `stroke={stroke}`;
        if (camelAttr === 'fill') return `fill={fill}`;
        if (camelAttr === 'width') return `width={width}`;
        if (camelAttr === 'height') return `height={height}`;
      }
      
      return `${camelAttr}="${value}"`;
    });
    
    // Конвертируем самозакрывающиеся теги в формат JSX
    cleaned = cleaned.replace(/<([a-z]+)([^>]*)\s*\/>/gi, '<$1$2 />');
    
    return cleaned;
  }

  /**
   * Генерирует React компонент на основе SVG кода
   */
  private generateReactComponent(svgCode: string, svgAttributes: Record<string, string>): string {
    let indentation = '  ';
    let extension = this.useTypescript ? '.tsx' : '.jsx';
    let componentDeclaration = '';
    let imports = '';
    let propsType = '';
    let returnStatement = '';
    let closing = '';
    
    // Определяем ключевые атрибуты из SVG для создания интерфейса Props
    const hasFill = svgAttributes.hasOwnProperty('fill');
    const hasStroke = svgAttributes.hasOwnProperty('stroke');
    const defaultWidth = svgAttributes['width'] || '24';
    const defaultHeight = svgAttributes['height'] || '24';
    const defaultFill = svgAttributes['fill'] || 'none';
    const defaultStroke = svgAttributes['stroke'] || 'currentColor';
    // Импорты
    if (this.useTypescript) {
      imports = `import { SVGProps } from 'react';\n\n`;
    } else {
      imports = ``;
    }
    
    // Объявление интерфейса Props
    if (this.useTypescript && this.useProps) {
      propsType = `interface Props extends SVGProps<SVGSVGElement> {\n`;
      propsType += `${indentation}width?: number | string;\n`;
      propsType += `${indentation}height?: number | string;\n`;
      
      if (hasFill) {
        propsType += `${indentation}fill?: string;\n`;
      }
      
      if (hasStroke) {
        propsType += `${indentation}stroke?: string;\n`;
      }
      
      propsType += `}\n\n`;
    }
    
    // Объявление компонента
    if (this.useArrowFunction) {
      if (this.useTypescript) {
        componentDeclaration = `const ${this.componentName} = ({\n`;
        if (this.useProps) {
          componentDeclaration += `${indentation}width = ${defaultWidth},\n`;
          componentDeclaration += `${indentation}height = ${defaultHeight},\n`;
          
          if (hasFill) {
            componentDeclaration += `${indentation}fill = "${defaultFill}",\n`;
          }
          
          if (hasStroke) {
            componentDeclaration += `${indentation}stroke = "${defaultStroke}",\n`;
          }
          
          componentDeclaration += `${indentation}...props\n`;
          componentDeclaration += `}: Props) => {\n`;
        } else {
          componentDeclaration += `${indentation}...props\n`;
          componentDeclaration += `}: SVGProps<SVGSVGElement>) => {\n`;
        }
      } else {
        componentDeclaration = `const ${this.componentName} = ({\n`;
        if (this.useProps) {
          componentDeclaration += `${indentation}width = ${defaultWidth},\n`;
          componentDeclaration += `${indentation}height = ${defaultHeight},\n`;
          
          if (hasFill) {
            componentDeclaration += `${indentation}fill = "${defaultFill}",\n`;
          }
          
          if (hasStroke) {
            componentDeclaration += `${indentation}stroke = "${defaultStroke}",\n`;
          }
          
          componentDeclaration += `${indentation}...props\n`;
          componentDeclaration += `}) => {\n`;
        } else {
          componentDeclaration += `${indentation}...props\n`;
          componentDeclaration += `}) => {\n`;
        }
      }
      returnStatement = `${indentation}return (\n`;
      closing = `};\n\nexport default ${this.componentName};`;
    } else {
      if (this.useTypescript) {
        componentDeclaration = `export default function ({\n`;
        if (this.useProps) {
          componentDeclaration += `${indentation}width = ${defaultWidth},\n`;
          componentDeclaration += `${indentation}height = ${defaultHeight},\n`;
          
          if (hasFill) {
            componentDeclaration += `${indentation}fill = "${defaultFill}",\n`;
          }
          
          if (hasStroke) {
            componentDeclaration += `${indentation}stroke = "${defaultStroke}",\n`;
          }
          
          componentDeclaration += `${indentation}...props\n`;
          componentDeclaration += `}: Props) {\n`;
        } else {
          componentDeclaration += `${indentation}...props\n`;
          componentDeclaration += `}: SVGProps<SVGSVGElement>) {\n`;
        }
      } else {
        componentDeclaration = `export default function ({\n`;
        if (this.useProps) {
          componentDeclaration += `${indentation}width = ${defaultWidth},\n`;
          componentDeclaration += `${indentation}height = ${defaultHeight},\n`;
          
          if (hasFill) {
            componentDeclaration += `${indentation}fill = "${defaultFill}",\n`;
          }
          
          if (hasStroke) {
            componentDeclaration += `${indentation}stroke = "${defaultStroke}",\n`;
          }
          
          componentDeclaration += `${indentation}...props\n`;
          componentDeclaration += `}) {\n`;
        } else {
          componentDeclaration += `${indentation}...props\n`;
          componentDeclaration += `}) {\n`;
        }
      }
      returnStatement = `${indentation}return (\n`;
      closing = `}`;
    }
    
    // Обрабатываем SVG-код
    let processedSvg = svgCode;
    
    // Если используем props, добавляем остальные свойства в корневой тег SVG
    if (this.useProps) {
      processedSvg = processedSvg.replace(/<svg([^>]*)>/i, (match, attributes) => {
        return `<svg${attributes} {...props}>`;
      });
    }
    
    // Добавляем отступы к SVG
    const indentedSvg = processedSvg
      .split('\n')
      .map(line => `${indentation}${indentation}${line}`)
      .join('\n');
    
    // Собираем весь компонент
    return `${imports}${propsType}${componentDeclaration}${returnStatement}${indentedSvg}\n${indentation});\n${closing}`;
  }

  /**
   * Обработчик нажатия клавиши ESC для выхода из полноэкранного режима
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event) {
    if (this.isInputFullscreen || this.isOutputFullscreen) {
      // Выходим из полноэкранного режима
      this.isInputFullscreen = false;
      this.isOutputFullscreen = false;
      
      // Обновляем размер редакторов
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
  
  /**
   * Toggle fullscreen mode for the specified editor
   */
  toggleFullscreen(editorType: 'input' | 'output') {
    if (!this.isBrowser) return;

    if (editorType === 'input') {
      this.isInputFullscreen = !this.isInputFullscreen;
      
      if (this.isInputFullscreen) {
        // Если переключаем на полноэкранный режим для input, выключаем для output
        this.isOutputFullscreen = false;
      }
    } else {
      this.isOutputFullscreen = !this.isOutputFullscreen;
      
      if (this.isOutputFullscreen) {
        // Если переключаем на полноэкранный режим для output, выключаем для input
        this.isInputFullscreen = false;
      }
    }
    
    // Resize the editor after toggling fullscreen
    setTimeout(() => {
      if (editorType === 'input' && this.inputMonacoEditor?.editor) {
        this.inputMonacoEditor.editor.layout();
      } else if (editorType === 'output' && this.outputMonacoEditor?.editor) {
        this.outputMonacoEditor.editor.layout();
      }
    }, 100);
  }
} 