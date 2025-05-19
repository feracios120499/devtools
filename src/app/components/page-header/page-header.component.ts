import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritePageDirective } from '../../directives/favorite-page.directive';

/**
 * Компонент для отображения заголовка страницы с унифицированным стилем
 * Использует ng-content для передачи содержимого заголовка
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CommonModule,
    FavoritePageDirective
  ],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  // Теперь заголовок передается через ng-content
} 