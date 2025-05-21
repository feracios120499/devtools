import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToolsService, ToolCategory } from '../../services/tools.service';
import { provideTablerIcons, TablerIconComponent } from 'angular-tabler-icons';

import { IconsModule } from '../../shared/modules/icons.module';
@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [MenuModule, BadgeModule, AvatarModule, RippleModule, CommonModule, RouterModule, TablerIconComponent, IconsModule],
  templateUrl: './leftbar.component.html',
  styleUrls: ['./leftbar.component.scss'],
})
export class LeftbarComponent implements OnInit, OnDestroy {
  items: MenuItem[] | undefined;
  private toolCategories: ToolCategory[] = [];

  constructor(
    private toolsService: ToolsService
  ) {    
    // Получаем категории инструментов
    effect(() => {
      this.toolCategories = this.toolsService.toolsByCategory();
      this.updateMenuItems();
    });
  }

  ngOnInit() {
    this.updateMenuItems();
  }

  ngOnDestroy() {
    // Очистка ресурсов при необходимости
  }

  /**
   * Обновляет пункты меню на основе категорий инструментов и статуса избранного
   */
  private updateMenuItems() {
    if (this.toolCategories.length === 0) {
      return;
    }
    
    const menuItems: MenuItem[] = [];
    
    // Для каждой категории добавляем заголовок, сепаратор и инструменты
    this.toolCategories.forEach(category => {
      // Пропускаем категорию Home, она добавляется отдельно первой
      if (category.name === 'Home') {
        return;
      }
      
      // Добавляем заголовок категории
      menuItems.push({
        label: category.name
      });
      
      // Добавляем сепаратор после заголовка
      menuItems.push({
        separator: true
      });
      
      // Добавляем инструменты категории
      menuItems.push({
        items: category.tools.map(tool => ({
          label: tool.label,
          icon: tool.icon,
          routerLink: tool.routerLink,
          isFavorite: tool.isFavorite
        }))
      });
    });
    
    // Создаем итоговое меню, начиная с Home
    const homeCategory = this.toolCategories.find(c => c.name === 'Home');
    
    this.items = [
      // Добавляем Home первым
      {
        items: homeCategory ? homeCategory.tools.map(tool => ({
          label: tool.label,
          icon: tool.icon,
          routerLink: tool.routerLink,
          isFavorite: tool.isFavorite
        })) : []
      },
      // Добавляем остальные категории
      ...menuItems
    ];
  }
}
