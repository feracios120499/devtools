import { Injectable, inject, signal, computed } from '@angular/core';
import { FavoritesService } from './favorites.service';

export interface Tool {
  id: string;      // Уникальный идентификатор (совпадает с routerLink без /)
  label: string;   // Название инструмента
  icon: string;    // Название иконки
  routerLink: string; // Ссылка на инструмент
  category: string;  // Категория инструмента
  description?: string; // Опциональное описание
  isFavorite?: boolean; // Флаг избранного
}

export interface ToolCategory {
  name: string;   // Название категории
  tools: Tool[];  // Инструменты в категории
}

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  private favoritesService = inject(FavoritesService);
  
  // Сигнал со всеми инструментами
  private _allTools = signal<Tool[]>([
    // JSON TOOLS
    {
      id: 'json-formatter',
      label: 'JSON Formatter',
      icon: 'align-left-2',
      routerLink: '/json-formatter',
      category: 'JSON TOOLS',
      description: 'Format and beautify JSON with customizable options'
    },
    {
      id: 'json-to-xml',
      label: 'JSON to XML',
      icon: 'file-type-xml',
      routerLink: '/json-to-xml',
      category: 'JSON TOOLS',
      description: 'Convert JSON to XML format'
    },
    {
      id: 'json-to-env',
      label: 'JSON to ENV',
      icon: 'brand-docker',
      routerLink: '/json-to-env',
      category: 'JSON TOOLS',
      description: 'Convert JSON to environment variables format'
    },
    {
      id: 'json-query',
      label: 'JSON Query Explorer',
      icon: 'pencil-search',
      routerLink: '/json-query',
      category: 'JSON TOOLS',
      description: 'Query and explore complex JSON structures'
    },
    // CSV TOOLS
    {
      id: 'csv-viewer',
      label: 'CSV Viewer',
      icon: 'table',
      routerLink: '/csv-viewer',
      category: 'CSV TOOLS',
      description: 'View and explore CSV files in tabular format'
    },
    // URL TOOLS
    {
      id: 'url-encoder',
      label: 'URL Encoder',
      icon: 'unlink',
      routerLink: '/url-encoder',
      category: 'URL TOOLS',
      description: 'Encode and decode URLs'
    },
    {
      id: 'url-to-qr',
      label: 'URL to QR Code',
      icon: 'qrcode',
      routerLink: '/url-to-qr',
      category: 'URL TOOLS',
      description: 'Generate QR codes from URLs'
    },
    // BASE64 TOOLS
    {
      id: 'base64',
      label: 'Base64 Encoder/Decoder',
      icon: 'transform',
      routerLink: '/base64',
      category: 'BASE64 TOOLS',
      description: 'Encode and decode Base64 strings'
    },
    {
      id: 'base64-to-file',
      label: 'Base64 to File',
      icon: 'file-arrow-right',
      routerLink: '/base64-to-file',
      category: 'BASE64 TOOLS',
      description: 'Convert Base64 strings to downloadable files'
    },
    {
      id: 'base64-to-hex',
      label: 'Base64 to HEX',
      icon: 'exchange',
      routerLink: '/base64-to-hex',
      category: 'BASE64 TOOLS',
      description: 'Convert between Base64 and hexadecimal formats'
    },
    // REACT TOOLS
    {
      id: 'svg-to-react-component',
      label: 'SVG to React Component',
      icon: 'brand-react',
      routerLink: '/svg-to-react-component',
      category: 'REACT TOOLS',
      description: 'Convert SVG files to React components'
    },
    // MISC TOOLS
    {
      id: 'color-converter',
      label: 'Color Converter',
      icon: 'palette',
      routerLink: '/color-converter',
      category: 'MISC TOOLS',
      description: 'Convert between color formats (HEX, RGB, HSL)'
    }
  ]);

  // Вычисляемый сигнал с инструментами, включая статус избранного
  allTools = computed(() => {
    return this._allTools().map(tool => ({
      ...tool,
      isFavorite: this.isFavorite(tool.routerLink)
    }));
  });

  // Вычисляемый сигнал с категориями и их инструментами
  toolsByCategory = computed(() => {
    const tools = this.allTools();
    const categories: ToolCategory[] = [];
    
    // Группировка инструментов по категориям
    tools.forEach(tool => {
      let category = categories.find(c => c.name === tool.category);
      
      if (!category) {
        category = { name: tool.category, tools: [] };
        categories.push(category);
      }
      
      category.tools.push(tool);
    });
    
    return categories;
  });

  // Избранные инструменты
  favoriteTools = computed(() => {
    return this.allTools().filter(tool => tool.isFavorite);
  });

  constructor() {}

  /**
   * Проверяет, является ли инструмент избранным
   * @param routerLink Путь маршрута инструмента
   * @returns true, если инструмент в избранном
   */
  isFavorite(routerLink: string): boolean {
    return this.favoritesService.isFavorite(routerLink);
  }

  /**
   * Добавляет или удаляет инструмент из избранного
   * @param routerLink Путь маршрута инструмента
   */
  toggleFavorite(routerLink: string): void {
    this.favoritesService.toggleFavorite(routerLink);
  }

  /**
   * Получает инструмент по его ID
   * @param id ID инструмента
   * @returns Инструмент или undefined, если не найден
   */
  getToolById(id: string): Tool | undefined {
    return this.allTools().find(tool => tool.id === id);
  }

  /**
   * Получает инструмент по его пути маршрута
   * @param routerLink Путь маршрута
   * @returns Инструмент или undefined, если не найден
   */
  getToolByRoute(routerLink: string): Tool | undefined {
    return this.allTools().find(tool => tool.routerLink === routerLink);
  }

  /**
   * Получает все инструменты из указанной категории
   * @param category Название категории
   * @returns Массив инструментов
   */
  getToolsByCategory(category: string): Tool[] {
    return this.allTools().filter(tool => tool.category === category);
  }
}