import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly DARK_CLASS = 'my-app-dark';
  private HTML_ELEMENT: Element | null = null;

  // Signal для отслеживания состояния темы
  isDarkMode = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Инициализируем только в браузере
    if (isPlatformBrowser(this.platformId)) {
      this.initBrowserFeatures();
    }
  }

  // Инициализация функций, которые зависят от браузера
  private initBrowserFeatures(): void {
    // Получаем HTML-элемент
    this.HTML_ELEMENT = document.querySelector('html');
    
    // Инициализация состояния на основе текущего класса
    if (this.HTML_ELEMENT) {
      this.isDarkMode.set(this.HTML_ELEMENT.classList.contains(this.DARK_CLASS));
    }

    // Наблюдаем за изменениями класса на HTML-элементе
    this.observeThemeChanges();
  }

  // Метод для получения состояния темы в виде строки для Monaco Editor
  getMonacoTheme(): string {
    return this.isDarkMode() ? 'vs-dark' : 'vs';
  }

  // Метод для переключения темы
  toggleDarkMode(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.HTML_ELEMENT) {
      this.HTML_ELEMENT.classList.toggle(this.DARK_CLASS);
      this.isDarkMode.set(this.HTML_ELEMENT.classList.contains(this.DARK_CLASS));
    }
  }

  // Метод для наблюдения за изменениями класса на HTML-элементе
  private observeThemeChanges(): void {
    if (!this.HTML_ELEMENT || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          this.isDarkMode.set(this.HTML_ELEMENT!.classList.contains(this.DARK_CLASS));
        }
      });
    });

    observer.observe(this.HTML_ELEMENT, { attributes: true });
  }
} 