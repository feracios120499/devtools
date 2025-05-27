import { Component, OnInit, OnDestroy, effect, Inject, PLATFORM_ID, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ToolsService, ToolCategory } from '../../services/tools.service';
import { provideTablerIcons, TablerIconComponent } from 'angular-tabler-icons';
import { filter, Subscription } from 'rxjs';

import { IconsModule } from '../../shared/modules/icons.module';

interface CollapsibleSection {
  id: string;
  name: string;
  isCollapsed: boolean;
  tools: MenuItem[];
}

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [MenuModule, BadgeModule, AvatarModule, RippleModule, CommonModule, RouterModule, TablerIconComponent, IconsModule],
  templateUrl: './leftbar.component.html',
  styleUrls: ['./leftbar.component.scss'],
})
export class LeftbarComponent implements OnInit, OnDestroy, AfterViewInit {
  items: MenuItem[] | undefined;
  favoriteTools: MenuItem[] | undefined;
  sections: CollapsibleSection[] = [];
  private toolCategories: ToolCategory[] = [];
  private readonly STORAGE_KEY = 'leftbar-collapsed-sections';
  isBrowser: boolean = false;
  private routerSubscription: Subscription | undefined;

  @ViewChild('menuContainer') menuContainer: ElementRef | undefined;

  constructor(
    private toolsService: ToolsService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Получаем категории инструментов
    effect(() => {
      this.toolCategories = this.toolsService.toolsByCategory();
      this.updateMenuItems();
    });
  }

  ngOnInit() {
    this.updateMenuItems();
    this.routerSubscription = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.scrollToActiveItem();
    });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  ngAfterViewInit() {
    this.scrollToActiveItem();
  }

  private getCollapsedSections(): string[] {
    if (!this.isBrowser) return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveCollapsedSections(): void {
    if (!this.isBrowser) return;
    
    try {
      const collapsedSections = this.sections
        .filter(section => section.isCollapsed)
        .map(section => section.id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collapsedSections));
    } catch (error) {
      console.warn('Failed to save collapsed sections to localStorage:', error);
    }
  }

  toggleSection(sectionId: string): void {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      section.isCollapsed = !section.isCollapsed;
      this.saveCollapsedSections();
      this.updateMenuItems();
    }
  }

  getSectionById(sectionName: string): CollapsibleSection | null {
    if(!this.isBrowser) return null;
    if(!sectionName) return null;
    const sectionId = sectionName.toLowerCase().replace(/\s+/g, '-');
    return this.sections.find(s => s.id === sectionId) || null;
  }

  /**
   * Обновляет пункты меню на основе категорий инструментов и статуса избранного
   */
  private updateMenuItems() {
    if (this.toolCategories.length === 0) {
      return;
    }
    
    const menuItems: MenuItem[] = [];
    const allFavoriteTools: MenuItem[] = [];
    const collapsedSections = this.getCollapsedSections();
    
    // Собираем избранные инструменты из всех категорий
    this.toolCategories.forEach(category => {
      const favoritesFromCategory = category.tools
        .filter(tool => tool.isFavorite)
        .map(tool => ({
          label: tool.label,
          icon: tool.icon,
          routerLink: tool.routerLink,
          isFavorite: tool.isFavorite
        }));
      
      allFavoriteTools.push(...favoritesFromCategory);
    });
    
    // Создаем разделы для управления состоянием
    this.sections = [];
    
    // Если есть избранные инструменты, добавляем их как отдельную категорию сверху
    if (allFavoriteTools.length > 0) {
      const favoritesSection: CollapsibleSection = {
        id: 'favorites',
        name: 'Favorites',
        isCollapsed: collapsedSections.includes('favorites'),
        tools: allFavoriteTools
      };
      this.sections.push(favoritesSection);
      
      // Добавляем элементы только если раздел не свернут
      if (!favoritesSection.isCollapsed) {
        menuItems.push({
          items: allFavoriteTools
        });
      }
    }
    
    // Для каждой категории добавляем заголовок, сепаратор и инструменты
    this.toolCategories.forEach(category => {
      // Пропускаем категорию Home
      if (category.name === 'Home') {
        return;
      }
      
      const sectionId = category.name.toLowerCase().replace(/\s+/g, '-');
      const isCollapsed = collapsedSections.includes(sectionId);
      
      const categoryTools = category.tools.map(tool => ({
        label: tool.label,
        icon: tool.icon,
        routerLink: tool.routerLink,
        isFavorite: tool.isFavorite
      }));
      
      // Создаем раздел для управления состоянием
      const section: CollapsibleSection = {
        id: sectionId,
        name: category.name,
        isCollapsed: isCollapsed,
        tools: categoryTools
      };
      this.sections.push(section);
      
      // Добавляем заголовок категории с кнопкой toggle
      menuItems.push({
        label: category.name,
        command: () => this.toggleSection(sectionId)
      });
      
      // Добавляем сепаратор после заголовка
      menuItems.push({
        separator: true
      });
      
      // Добавляем инструменты категории только если раздел не свернут
      if (!isCollapsed) {
        menuItems.push({
          items: categoryTools
        });
      }
    });
    
    // Создаем итоговое меню
    this.items = menuItems;
  }

  private scrollToActiveItem() {
    if (!this.isBrowser) return;
    
    // Даем время для рендеринга меню
    setTimeout(() => {
      // Ищем активный элемент по class active-menuitem
      const activeItem = this.elementRef.nativeElement.querySelector('.active-menuitem');
      
      if (activeItem) {
        activeItem.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 150);
  }
}
