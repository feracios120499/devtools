import { Component, OnInit, OnDestroy, inject, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

// Icons module
import { IconsModule } from '../../shared/modules/icons.module';

// Services
import { PageTitleService } from '../../services/page-title.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    IconsModule
  ],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit, OnDestroy {

  @HostBinding('class') class = 'dt-page';
  
  private pageTitleService = inject(PageTitleService);
  private seoService = inject(SeoService);
  
  ngOnInit() {
    // Set page title
    this.pageTitleService.setTitle('Page Not Found - 404');
    
    // SEO settings
    this.setupSeo();
  }

  ngOnDestroy() {
    // Clean up SEO elements
    this.seoService.destroy();
  }
  
  // Setup SEO using SeoService
  private setupSeo() {
    this.seoService.setupSeo({
      OgTitle: 'Page Not Found - 404 | DevTools',
      OgDescription: 'The page you are looking for could not be found. Visit our homepage to explore available developer tools.',
      description: 'The page you are looking for could not be found. Return to our collection of free developer tools including JSON formatter, converters, and utilities.',
      keywords: ['404', 'page not found', 'developer tools', 'DevTools'],
      jsonLd: {
        name: 'Page Not Found - DevTools',
        description: 'The requested page could not be found.',
        url: 'https://onlinewebdevtools.com'
      }
    });
  }
} 