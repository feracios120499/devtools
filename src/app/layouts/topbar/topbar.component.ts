import { Component, effect } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ThemeService } from '../../services/theme.service';
import { PageTitleService } from '../../services/page-title.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [ButtonModule, MenubarModule, CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  items: MenuItem[] = [
    {
      label: 'File2',
      icon: 'pi pi-fw pi-file',
      items: [
        {
          label: 'New',
          icon: 'pi pi-fw pi-plus',
        },
        {
          label: 'Open',
          icon: 'pi pi-fw pi-folder-open'
        },
        {
          separator: true
        },
        {
          label: 'Exit',
          icon: 'pi pi-fw pi-power-off'
        }
      ]
    },
    {
      label: 'Edit',
      icon: 'pi pi-fw pi-pencil',
      items: [
        {
          label: 'Undo',
          icon: 'pi pi-fw pi-undo'
        },
        {
          label: 'Redo',
          icon: 'pi pi-fw pi-replay'
        }
      ]
    },
    {
      label: 'Help',
      icon: 'pi pi-fw pi-question-circle',
      items: [
        {
          label: 'About',
          icon: 'pi pi-fw pi-info-circle'
        }
      ]
    }
  ];

  // Get page title from service
  pageTitle;

  constructor(
    private themeService: ThemeService,
    private pageTitleService: PageTitleService
  ) {
    // Initialize pageTitle in constructor
    this.pageTitle = this.pageTitleService.getTitle();
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
} 