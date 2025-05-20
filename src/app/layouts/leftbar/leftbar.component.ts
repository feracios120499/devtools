import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { provideTablerIcons, TablerIconComponent } from 'angular-tabler-icons';
import {
  IconClearFormatting,
  IconHome,
  IconFileTypeXml,
  IconBrandDocker,
  IconPencilSearch,
  IconTable,
  IconUnlink,
  IconQrcode,
  IconFileArrowRight,
  IconAlignLeft2,
  IconTransform,
  IconExchange,
  IconBrandReact,
  IconPalette,
  IconStar,
  IconStarFilled
} from 'angular-tabler-icons/icons';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [MenuModule, BadgeModule, AvatarModule, RippleModule, CommonModule, RouterModule, TablerIconComponent],
  templateUrl: './leftbar.component.html',
  styleUrls: ['./leftbar.component.scss'],
  providers: [provideTablerIcons({ 
    IconClearFormatting, 
    IconHome, 
    IconFileTypeXml, 
    IconBrandDocker, 
    IconPencilSearch, 
    IconTable, 
    IconUnlink, 
    IconQrcode, 
    IconFileArrowRight, 
    IconAlignLeft2,
    IconTransform,
    IconExchange,
    IconBrandReact,
    IconPalette,
    IconStar,
    IconStarFilled
  })]
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
            icon: 'home',
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
            icon: 'align-left-2',
            routerLink: '/json-formatter',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/json-formatter')
          },
          {
            label: 'JSON to XML',
            icon: 'file-type-xml',
            routerLink: '/json-to-xml',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/json-to-xml')
          },
          {
            label: 'JSON to ENV',
            icon: 'brand-docker',
            routerLink: '/json-to-env',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/json-to-env')
          },
          {
            label: 'JSON Query Explorer',
            icon: 'pencil-search',
            routerLink: '/json-query',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/json-query')
          }
        ],
      },
      {
        label: 'CSV TOOLS',
      },
      {
        separator: true,
      },
      {
        items: [
          {
            label: 'CSV Viewer',
            icon: 'table',
            routerLink: '/csv-viewer',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/csv-viewer')
          },
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
            icon: 'unlink',
            routerLink: '/url-encoder',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/url-encoder')
          },
          {
            label: 'URL to QR Code',
            icon: 'qrcode',
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
            icon: 'transform',
            routerLink: '/base64',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/base64')
          },
          {
            label: 'Base64 to File',
            icon: 'file-arrow-right',
            routerLink: '/base64-to-file',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/base64-to-file')
          },
          {
            label: 'Base64 to HEX',
            icon: 'exchange',
            routerLink: '/base64-to-hex',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/base64-to-hex')
          }
        ],
      },
      {
        label: 'REACT TOOLS',
      },
      {
        separator: true,
      },
      {
        items: [
          {
            label: 'SVG to React Component',
            icon: 'brand-react',
            routerLink: '/svg-to-react-component',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/svg-to-react-component')
          }
        ],
      },
      {
        label: 'MISC TOOLS',
      },
      {
        separator: true,
      },
      {
        items: [
          {
            label: 'Color Converter',
            icon: 'palette',
            routerLink: '/color-converter',
            // Добавляем флаг избранного
            isFavorite: this.favoritesService.isFavorite('/color-converter')
          }
        ],
      },
    ];
  }
}
