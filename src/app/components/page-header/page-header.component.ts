import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { provideTablerIcons, TablerIconComponent } from 'angular-tabler-icons';
import { IconStar, IconStarFilled } from 'angular-tabler-icons/icons';
/**
 * Компонент для отображения заголовка страницы с унифицированным стилем
 * Использует ng-content для передачи содержимого заголовка
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TablerIconComponent
  ],
  providers: [provideTablerIcons({ IconStar, IconStarFilled })],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent implements OnInit {
  // Теперь заголовок передается через ng-content
  private isBrowser = false;
  private currentRoute: string = '';
  isFavorite = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private favoritesService: FavoritesService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }


  toggleFavorite() {
    if (!this.isBrowser) return;
    
    this.favoritesService.toggleFavorite(this.currentRoute);
    this.isFavorite = this.favoritesService.isFavorite(this.currentRoute);
  }

  ngOnInit(): void {
    // Проверяем, что мы в браузере, а не в SSR
    if (!this.isBrowser) return;

    // Получаем текущий маршрут
    this.currentRoute = this.router.url;
    this.isFavorite = this.favoritesService.isFavorite(this.currentRoute);
  }
} 