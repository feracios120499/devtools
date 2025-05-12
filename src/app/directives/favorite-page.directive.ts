import { Directive, ElementRef, OnInit, Renderer2, inject, Inject, PLATFORM_ID, ComponentRef, Injector, createComponent, ApplicationRef, EnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritesService } from '../services/favorites.service';
import { isPlatformBrowser } from '@angular/common';
import { Button } from 'primeng/button';

@Directive({
  selector: '[appFavoritePage]',
  standalone: true
})
export class FavoritePageDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  private applicationRef = inject(ApplicationRef);
  private environmentInjector = inject(EnvironmentInjector);
  
  private isBrowser = isPlatformBrowser(this.platformId);
  private buttonComponentRef: ComponentRef<Button> | null = null;
  private currentRoute: string = '';

  ngOnInit() {
    // Проверяем, что мы в браузере, а не в SSR
    if (!this.isBrowser) return;
    
    // Получаем текущий маршрут
    this.currentRoute = this.router.url;
    
    // Создаем кнопку-звездочку
    this.createPrimeNgButton();
    
    // Добавляем кнопку в элемент
    this.addButtonToHeader();
  }

  /**
   * Создает кнопку PrimeNG для добавления/удаления из избранного
   */
  private createPrimeNgButton() {
    if (!this.isBrowser) return;
    
    const isFavorite = this.favoritesService.isFavorite(this.currentRoute);
    
    // Создаем компонент p-button
    this.buttonComponentRef = createComponent(Button, {
      environmentInjector: this.environmentInjector,
      hostElement: document.createElement('div')
    });
    
    // Настраиваем свойства кнопки
    const buttonInstance = this.buttonComponentRef.instance;
    buttonInstance.icon = isFavorite ? 'pi pi-star-fill' : 'pi pi-star';
    buttonInstance.rounded = true;
    buttonInstance.outlined = !isFavorite;
    
    // Применяем изменения
    this.buttonComponentRef.changeDetectorRef.detectChanges();
    
    // Добавляем тултип к кнопке
    this.updateTooltip(isFavorite);
    
    // Добавляем обработчик клика
    this.buttonComponentRef.location.nativeElement.addEventListener('click', () => {
      this.toggleFavorite();
    });
  }

  /**
   * Обновляет тултип кнопки
   */
  private updateTooltip(isFavorite: boolean) {
    if (!this.buttonComponentRef) return;
    
    // Находим кнопку внутри компонента
    const buttonElement = this.buttonComponentRef.location.nativeElement.querySelector('button');
    if (!buttonElement) return;
    
    // Устанавливаем атрибуты тултипа
    this.renderer.setAttribute(buttonElement, 'pTooltip', isFavorite ? 'Remove from favorites' : 'Add to favorites');
    this.renderer.setAttribute(buttonElement, 'tooltipPosition', 'bottom');
  }

  /**
   * Добавляет кнопку в заголовок страницы
   */
  private addButtonToHeader() {
    if (!this.isBrowser || !this.buttonComponentRef) return;
    
    // Добавляем CSS-класс для позиционирования flex
    this.renderer.addClass(this.el.nativeElement, 'flex');
    this.renderer.addClass(this.el.nativeElement, 'justify-between');
    this.renderer.addClass(this.el.nativeElement, 'items-center');
    
    // Добавляем кнопку в конец элемента
    this.renderer.appendChild(this.el.nativeElement, this.buttonComponentRef.location.nativeElement);
  }

  /**
   * Переключает статус избранного для текущей страницы
   */
  private toggleFavorite() {
    if (!this.isBrowser || !this.buttonComponentRef) return;
    
    this.favoritesService.toggleFavorite(this.currentRoute);
    const isFavorite = this.favoritesService.isFavorite(this.currentRoute);
    
    // Обновляем свойства кнопки
    const buttonInstance = this.buttonComponentRef.instance;
    buttonInstance.icon = isFavorite ? 'pi pi-star-fill' : 'pi pi-star';
    buttonInstance.outlined = !isFavorite;
    
    // Обновляем тултип
    this.updateTooltip(isFavorite);
    
    // Применяем изменения
    this.buttonComponentRef.changeDetectorRef.detectChanges();
  }
}