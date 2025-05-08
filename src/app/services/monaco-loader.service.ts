import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class MonacoLoaderService {
  private _monaco: any = null;
  private _initialized = false;
  private _initCallbacks: ((monaco: any) => void)[] = [];
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    // Инициализация только в браузере
    if (isPlatformBrowser(this.platformId)) {
      this.initMonaco();
    }
  }
  
  private initMonaco(): void {
    // Проверяем, уже загружен ли Monaco
    if (typeof window !== 'undefined' && (window as any).monaco) {
      this._monaco = (window as any).monaco;
      this._initialized = true;
      this.executeCallbacks();
      return;
    }
    
    // Добавляем слушатель события загрузки Monaco (который отправляется из monaco-loader.js)
    window.addEventListener('monaco-editor-loaded', () => {
      // Обертываем в NgZone, чтобы Angular знал об изменениях
      this.ngZone.run(() => {
        console.log('Monaco editor loaded event received');
        this._monaco = (window as any).monaco;
        this._initialized = true;
        this.executeCallbacks();
      });
    });
    
    // Запускаем таймер на случай, если событие не придет
    setTimeout(() => {
      if (!this._initialized && typeof window !== 'undefined' && (window as any).monaco) {
        this.ngZone.run(() => {
          console.log('Monaco found via timeout check');
          this._monaco = (window as any).monaco;
          this._initialized = true;
          this.executeCallbacks();
        });
      }
    }, 2000);
  }
  
  private executeCallbacks(): void {
    if (!this._initialized || !this._monaco) {
      return;
    }
    
    // Вызываем все ожидающие колбэки
    while (this._initCallbacks.length > 0) {
      try {
        const callback = this._initCallbacks.shift();
        if (callback) {
          callback(this._monaco);
        }
      } catch (e) {
        console.error('Error in Monaco callback:', e);
      }
    }
  }
  
  /**
   * Получить экземпляр Monaco, когда он будет доступен
   */
  get monaco(): any {
    return this._monaco;
  }
  
  /**
   * Проверить доступность Monaco
   */
  isMonacoAvailable(): boolean {
    return this._initialized && !!this._monaco;
  }
  
  /**
   * Выполнить код, когда Monaco будет готов
   */
  whenReady(callback: (monaco: any) => void): void {
    // Пропускаем на сервере
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    if (this.isMonacoAvailable()) {
      // Monaco уже доступен, выполняем сразу
      this.loadJsonMode().then(() => {
        callback(this._monaco);
      });
    } else {
      // Добавляем в очередь для выполнения после загрузки
      this._initCallbacks.push((monaco) => {
        this.loadJsonMode().then(() => {
          callback(monaco);
        });
      });
    }
  }
  
  /**
   * Загружает JSON Mode если он еще не загружен
   */
  private loadJsonMode(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this._monaco && !this._monaco.languages.json) {
        console.log('Loading JSON mode manually');
        
        // Загружаем JSON Mode вручную
        const script = document.createElement('script');
        script.src = '/assets/monaco/vs/language/json/jsonMode.js';
        script.onload = () => {
          console.log('JSON mode loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          console.error('Error loading JSON mode:', error);
          resolve(); // Resolve anyway to allow editor to work
        };
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }
} 