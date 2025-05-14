import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [MenuModule, BadgeModule, AvatarModule, RippleModule, CommonModule, RouterModule],
  templateUrl: './leftbar.component.html',
  styleUrls: ['./leftbar.component.scss'],
})
export class LeftbarComponent implements OnInit, OnDestroy {
  items: MenuItem[] | undefined;
  
  constructor(private favoritesService: FavoritesService) {
    // Используем effect для отслеживания изменений в сигнале
    effect(() => {
      // При изменении favorites сигнала, обновляем меню
      this.favoritesService.favorites();
      this.updateMenuItems();
    });
  }

  ngOnInit() {
    this.updateMenuItems();
  }
  
  ngOnDestroy() {
    // Очистка ресурсов при необходимости
  }

  private updateMenuItems() {
    this.items = [
      {
        items: [
          {
            label: 'Home',
            icon: 'pi pi-home',
            routerLink: '/',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/')
          },
        ],
      },
      {
        label: 'JSON TOOLS',
      },
      {
        separator: true,
      },
      {
        items: [
          {
            label: 'JSON Formatter',
            icon: 'pi pi-code',
            routerLink: '/json-formatter',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/json-formatter')
          },
          {
            label: 'JSON to XML',
            icon: 'pi pi-sync',
            routerLink: '/json-to-xml',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/json-to-xml')
          }
        ],
      },
      {
        label: 'URL TOOLS',
      },
      {
        separator: true,
      },
      {
        items: [
          {
            label: 'URL Encoder',
            icon: 'pi pi-link',
            routerLink: '/url-encoder',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/url-encoder')
          },
          {
            label: 'URL to QR Code',
            icon: 'pi pi-qrcode',
            routerLink: '/url-to-qr',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/url-to-qr')
          }
        ],
      },
      {
        label: 'BASE64 TOOLS',
      },
      {
        separator: true,
      },
      {
        items: [
          {
            label: 'Base64 Encoder/Decoder',
            icon: 'pi pi-file-export',
            routerLink: '/base64',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/base64')
          },
          {
            label: 'Base64 to File',
            icon: 'pi pi-download',
            routerLink: '/base64-to-file',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/base64-to-file')
          }
        ],
      },
    ];
  }
}
