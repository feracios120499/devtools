import { Component, OnInit, AfterViewInit, PLATFORM_ID, Inject, ApplicationRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { TopbarComponent } from './layouts/topbar/topbar.component';
import { LeftbarComponent } from './layouts/leftbar/leftbar.component';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { LoadingService } from './services/loading.service';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopbarComponent,
    LeftbarComponent,
    MonacoEditorModule,
    LoadingScreenComponent,
  ],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'devtools';
  
  constructor(
    public loadingService: LoadingService, // Публичный для доступа из шаблона
    private appRef: ApplicationRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit() {
    // На сервере не активируем загрузку, чтобы не мешать SEO и SSR
    if (isPlatformBrowser(this.platformId)) {
      // В режиме браузера НЕ устанавливаем loading в true,
      // т.к. вместо компонента LoadingScreen будем использовать начальный экран
      // из index.html, чтобы избежать мигания экрана загрузки
      this.loadingService.setLoading(false);
      
      // Ждем стабилизации приложения для скрытия начального экрана загрузки
      this.waitForAppStability();
    } else {
      // На сервере сразу отключаем загрузку для корректного SSR и SEO
      this.loadingService.setLoading(false);
    }
  }
  
  /**
   * Ожидает стабилизации приложения и затем скрывает экран загрузки
   */
  private waitForAppStability() {
    // Дожидаемся первой стабилизации Angular
    this.appRef.isStable.pipe(
      first(isStable => isStable)
    ).subscribe(() => {
      console.log('Angular app stabilized, hiding initial loading screen');
      
      // После стабилизации Angular скрываем начальный экран загрузки
      this.hideInitialLoading();
    });
  }
  
  /**
   * Скрывает начальный экран загрузки из index.html
   */
  private hideInitialLoading() {
    // Обеспечиваем доступ к функции из window
    if (typeof window !== 'undefined' && typeof (window as any).hideInitialLoading === 'function') {
      console.log('Calling hideInitialLoading');
      (window as any).hideInitialLoading();
    } else {
      console.warn('hideInitialLoading function not found in window');
      
      // Резервный вариант, если функция не определена
      const initialLoading = document.getElementById('initialLoading');
      if (initialLoading) {
        initialLoading.style.opacity = '0';
        setTimeout(() => {
          initialLoading.style.display = 'none';
          const appRoot = document.querySelector('app-root');
          if (appRoot) {
            appRoot.classList.add('initialized');
          }
        }, 500);
      }
    }
  }
  
  ngAfterViewInit() {
    // Метод оставлен для совместимости с интерфейсом
  }
}
