import { Component, ViewChild, ElementRef, AfterViewInit, effect, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TablerIconComponent } from 'angular-tabler-icons';
import { IconsModule } from '../../shared/modules/icons.module';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { FormsModule } from '@angular/forms';
import { AutoFocusModule } from 'primeng/autofocus';
import { Tool, ToolsService } from '../../services/tools.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [ButtonModule, MenubarModule, CommonModule, TablerIconComponent, IconsModule, DialogModule, InputTextModule, InputIconModule, IconFieldModule, FormsModule, AutoFocusModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements AfterViewInit {
  // Get page title from service
  pageTitle;
  visible = false;
  searchValue = '';
  public tools: Tool[] = [];
  activeTool: Tool | null = null;
  selectedIndex = 0;
  filteredTools: Tool[] = [];
  isMacOS = false;
  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private themeService: ThemeService,
    private pageTitleService: PageTitleService,
    private toolsService: ToolsService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize pageTitle in constructor
    this.pageTitle = this.pageTitleService.getTitle();
    
    // Определяем macOS
    if (isPlatformBrowser(this.platformId)) {
      this.isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                    /iPhone|iPad|iPod/.test(navigator.userAgent);
    }
    
    effect(() => {
      this.tools = this.toolsService.allTools().filter(tool => tool.label != 'Home');
      this.activeTool = this.favoriteTools[0];
      this.filteredTools = this.tools;
    });
  }

  get favoriteTools() {
    return this.tools.filter(tool => tool.isFavorite);
  }

  // Добавляем геттер для фильтрованных инструментов
  get displayedTools() {
    if (this.searchValue.length === 0) {
      return this.favoriteTools;
    }

    return this.filteredTools = this.tools.filter(tool =>
      tool.label.toLowerCase().includes(this.searchValue.toLowerCase()) ||
      (tool.description && tool.description.toLowerCase().includes(this.searchValue.toLowerCase()))
    );
  }

  ngAfterViewInit() {
    // Никаких дополнительных действий пока не требуется
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  showSearchModal() {
    this.visible = true;
  }

  onDialogShow() {
    this.searchValue = '';
    this.selectedIndex = 0;
    this.filteredTools = this.tools;
    this.activeTool = this.displayedTools.length > 0 ? this.displayedTools[0] : null;
    // Установка фокуса после того, как диалог полностью отобразился
    setTimeout(() => {
      if (this.searchInput && this.searchInput.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    }, 50);
  }

  onDialogHide() {
    this.searchValue = '';
    this.selectedIndex = 0;
  }

  clearSearch() {
    this.searchValue = '';
    this.filteredTools = this.tools;
    this.selectedIndex = 0;
    this.activeTool = this.displayedTools.length > 0 ? this.displayedTools[0] : null;
    // Возвращаем фокус на поле ввода
    if (this.searchInput && this.searchInput.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  /**
   * Обработка изменения значения поиска
   */
  onSearchChange(): void {
    this.selectedIndex = 0;
    this.activeTool = this.displayedTools.length > 0 ? this.displayedTools[0] : null;
  }

  onToolHover(tool: Tool) {
    this.activeTool = tool;
    // Обновляем selectedIndex при наведении мыши
    const index = this.displayedTools.findIndex(t => t === tool);
    if (index !== -1) {
      this.selectedIndex = index;
    }
  }

  /**
   * Обработка нажатия стрелки вниз
   * @param event Событие клавиатуры
   */
  handleArrowDown(event: KeyboardEvent): void {
    event.preventDefault();
    if (this.displayedTools.length > 0) {
      this.selectedIndex = (this.selectedIndex + 1) % this.displayedTools.length;
      this.activeTool = this.displayedTools[this.selectedIndex];
    }
  }

  /**
   * Обработка нажатия стрелки вверх
   * @param event Событие клавиатуры
   */
  handleArrowUp(event: KeyboardEvent): void {
    event.preventDefault();
    if (this.displayedTools.length > 0) {
      this.selectedIndex = (this.selectedIndex - 1 + this.displayedTools.length) % this.displayedTools.length;
      this.activeTool = this.displayedTools[this.selectedIndex];
    }
  }

  /**
   * Обработка нажатия клавиши Enter
   * @param event Событие клавиатуры
   */
  handleEnter(event: any): void {
    event.preventDefault();
    if (this.activeTool) {
      this.visible = false;
      this.router.navigate([this.activeTool.routerLink]);
    }
  }

  /**
   * Глобальный перехват клавиатурных событий
   * @param event Событие клавиатуры
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Проверяем комбинацию Ctrl+K или Cmd+K для открытия поиска
    if ((this.isMacOS && event.metaKey && (event.key.toLowerCase() === 'k' || event.key.toLowerCase() === 'л')) || 
        (!this.isMacOS && event.ctrlKey && event.key.toLowerCase() === 'k' || event.key.toLowerCase() === 'л')) {
      event.preventDefault();
      this.showSearchModal();
      return;
    }

    // Обрабатываем клавиши только когда диалог открыт
    if (!this.visible) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        this.handleArrowDown(event);
        break;
      case 'ArrowUp':
        this.handleArrowUp(event);
        break;
      case 'Enter':
        this.handleEnter(event);
        break;
      case 'Escape':
        this.visible = false;
        break;
    }
  }
} 