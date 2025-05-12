import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Получает данные из localStorage
   * @param key Ключ для получения данных
   * @returns Данные, сохраненные под указанным ключом, или null, если данных нет
   */
  getItem<T>(key: string): T | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item from localStorage: ${error}`);
      return null;
    }
  }

  /**
   * Сохраняет данные в localStorage
   * @param key Ключ для сохранения данных
   * @param value Данные для сохранения
   */
  setItem<T>(key: string, value: T): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item in localStorage: ${error}`);
    }
  }

  /**
   * Удаляет данные из localStorage
   * @param key Ключ для удаления данных
   */
  removeItem(key: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage: ${error}`);
    }
  }
}