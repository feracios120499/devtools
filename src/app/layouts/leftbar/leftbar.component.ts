import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [MenuModule, BadgeModule, AvatarModule, RippleModule, CommonModule, RouterModule],
  templateUrl: './leftbar.component.html',
  styleUrls: ['./leftbar.component.scss'],
})
export class LeftbarComponent implements OnInit {
  items: MenuItem[] | undefined;

  ngOnInit() {
    this.items = [
      {
        items: [
          {
            label: 'Home',
            icon: 'pi pi-home',
            routerLink: '/',
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
          },
          {
            label: 'JSON to XML',
            icon: 'pi pi-sync',
            routerLink: '/json-to-xml',
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
          }
        ],
      },
    ];
  }
}
