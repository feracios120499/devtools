import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Интерфейс для настроек страницы.
 * Каждый компонент может расширять этот интерфейс для своих потребностей.
 */
export interface PageSettings {
  // Общие поля могут быть добавлены здесь
  [key: string]: any;
}

/**
 * Интерфейс для настроек конвертера Base64 в HEX
 */
export interface Base64ToHexSettings extends PageSettings {
  selectedFormatValue: string;
}

/**
 * Интерфейс для настроек генератора QR-кодов из URL
 */
export interface UrlToQrSettings extends PageSettings {
  qrSize: number;
  errorCorrectionLevel: string;
  darkColor: string;
  lightColor: string;
}

/**
 * Сервис для сохранения и загрузки пользовательских настроек в localStorage.
 * Каждая страница идентифицируется своим URL путем.
 */
@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly STORAGE_PREFIX = 'devtools_preferences_';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Сохраняет настройки страницы в localStorage
   * @param pageUrl URL страницы (ключ для хранения)
   * @param settings Объект с настройками для сохранения
   * @returns boolean Успешно ли выполнено сохранение
   */
  savePageSettings(pageUrl: string, settings: PageSettings): boolean {
    if (!this.isBrowser) return false;

    try {
      const key = this.getStorageKey(pageUrl);
      localStorage.setItem(key, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      return false;
    }
  }

  /**
   * Загружает настройки страницы из localStorage
   * @param pageUrl URL страницы (ключ для поиска)
   * @returns T | null Объект с настройками или null, если настройки не найдены
   */
  loadPageSettings<T extends PageSettings>(pageUrl: string): T | null {
    if (!this.isBrowser) return null;

    try {
      const key = this.getStorageKey(pageUrl);
      const storedData = localStorage.getItem(key);
      
      if (!storedData) return null;
      
      return JSON.parse(storedData) as T;
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      return null;
    }
  }

  /**
   * Очищает настройки конкретной страницы
   * @param pageUrl URL страницы
   * @returns boolean Успешно ли выполнена очистка
   */
  clearPageSettings(pageUrl: string): boolean {
    if (!this.isBrowser) return false;

    try {
      const key = this.getStorageKey(pageUrl);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing settings from localStorage:', error);
      return false;
    }
  }

  /**
   * Очищает все настройки приложения
   * @returns boolean Успешно ли выполнена очистка
   */
  clearAllSettings(): boolean {
    if (!this.isBrowser) return false;

    try {
      // Удаляем только ключи, начинающиеся с префикса
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing all settings from localStorage:', error);
      return false;
    }
  }

  /**
   * Формирует ключ для хранения в localStorage на основе URL страницы
   * @param pageUrl URL страницы
   * @returns string Ключ для localStorage
   */
  private getStorageKey(pageUrl: string): string {
    // Удаляем ведущий слеш и очищаем путь для использования в качестве ключа
    const cleanPath = pageUrl.replace(/^\//, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${this.STORAGE_PREFIX}${cleanPath}`;
  }
} 