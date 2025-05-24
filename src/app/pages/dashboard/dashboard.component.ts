import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';

// Icons module
import { IconsModule } from '../../shared/modules/icons.module';

// Services
import { PageTitleService } from '../../services/page-title.service';
import { ToolsService, Tool } from '../../services/tools.service';
import { SeoService } from '../../services/seo.service';

// Interface for feature cards (for compatibility)
interface FeatureCard {
  title: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ImageModule,
    TooltipModule,
    IconsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  
  // Feature cards list - now populated from ToolsService
  featureCards: FeatureCard[] = [];
  
  constructor(
    private pageTitleService: PageTitleService,
    private toolsService: ToolsService,
    private seoService: SeoService
  ) { }
  
  ngOnInit() {
    // Set page title
    this.pageTitleService.setTitle('Web Developer Tools');
    
    // Load feature cards from ToolsService
    this.loadFeatureCards();
    
    // SEO settings
    this.setupSeo();
  }

  ngOnDestroy() {
    // Clean up SEO elements
    this.seoService.destroy();
  }

  // Load feature cards from ToolsService
  private loadFeatureCards() {
    const tools = this.toolsService.allTools();
    
    // Convert Tool objects to FeatureCard format
    this.featureCards = tools.map((tool: Tool) => ({
      title: tool.label,
      description: tool.description || 'Developer tool',
      route: tool.routerLink,
      icon: tool.icon // Use Tabler icon names directly
    }));
  }
  
  // Setup SEO using SeoService
  private setupSeo() {
    this.seoService.setupSeo({
      OgTitle: 'Web Developer Tools | DevTools',
      OgDescription: 'Collection of free online tools for web developers. Format JSON, convert data formats, and more.',
      description: 'Free online tools for developers including JSON formatter, JSON to XML converter, and more. Improve your workflow with these handy utilities.',
      keywords: ['developer tools', 'JSON formatter', 'JSON to XML', 'web development utilities', 'code tools'],
      jsonLd: {
        name: 'DevTools - Web Developer Utilities',
        description: 'Collection of free online tools for web developers including JSON formatter, converters, and other utilities.',
        url: 'https://onlinewebdevtools.com'
      }
    });
  }
} 