import { Injectable, inject, signal } from '@angular/core';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly storageKey = 'devtools_favorites';
  private localStorage = inject(LocalStorageService);

  // Сигнал с текущими избранными инструментами
  favorites = signal<string[]>([]);

  constructor() {
    this.loadFavorites();
  }

  /**
   * Загружает избранные инструменты из localStorage
   */
  private loadFavorites(): void {
    const storedFavorites = this.localStorage.getItem<string[]>(this.storageKey);
    if (storedFavorites) {
      this.favorites.set(storedFavorites);
    }
  }

  /**
   * Сохраняет избранные инструменты в localStorage
   */
  private saveFavorites(): void {
    this.localStorage.setItem(this.storageKey, this.favorites());
  }

  /**
   * Проверяет, добавлен ли инструмент в избранное
   * @param routePath Путь маршрута инструмента
   * @returns true, если инструмент в избранном
   */
  isFavorite(routePath: string): boolean {
    return this.favorites().includes(routePath);
  }

  /**
   * Добавляет или удаляет инструмент из избранного
   * @param routePath Путь маршрута инструмента
   */
  toggleFavorite(routePath: string): void {
    const currentFavorites = this.favorites();
    
    if (this.isFavorite(routePath)) {
      // Удаляем из избранного
      this.favorites.set(currentFavorites.filter(path => path !== routePath));
    } else {
      // Добавляем в избранное
      this.favorites.set([...currentFavorites, routePath]);
    }
    
    this.saveFavorites();
  }
}