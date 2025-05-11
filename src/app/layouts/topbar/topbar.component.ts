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