import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { PageTitleService } from '../../services/page-title.service';

// Interface for feature cards
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
    CardModule,
    ButtonModule,
    ImageModule,
    TooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  
  // Feature cards list
  featureCards: FeatureCard[] = [
    {
      title: 'JSON Formatter',
      description: 'Format, validate and beautify JSON data with customizable spacing options.',
      route: '/json-formatter',
      icon: 'pi pi-code'
    },
    {
      title: 'JSON to XML',
      description: 'Convert JSON data to XML format with customizable root element.',
      route: '/json-to-xml',
      icon: 'pi pi-sync'
    },
    {
      title: 'URL Encoder',
      description: 'Encode and decode URLs for safe transmission over the Internet.',
      route: '/url-encoder',
      icon: 'pi pi-link'
    },
    {
      title: 'Base64 Converter',
      description: 'Encode and decode text using Base64 encoding.',
      route: '/base64',
      icon: 'pi pi-file-export'
    },
    {
      title: 'Color Converter',
      description: 'Convert between color formats: HEX, RGB, HSL and more.',
      route: '/color-converter',
      icon: 'pi pi-palette'
    },
    {
      title: 'UUID Generator',
      description: 'Generate random UUIDs/GUIDs for your applications.',
      route: '/uuid-generator',
      icon: 'pi pi-key'
    },
    {
      title: 'Markdown Editor',
      description: 'Write and preview Markdown with real-time rendering.',
      route: '/markdown-editor',
      icon: 'pi pi-file-edit'
    },
    {
      title: 'JWT Decoder',
      description: 'Decode and verify JSON Web Tokens (JWT) with ease.',
      route: '/jwt-decoder',
      icon: 'pi pi-lock'
    },
    {
      title: 'HTML Encoder',
      description: 'Convert special characters to HTML entities and back.',
      route: '/html-encoder',
      icon: 'pi pi-code'
    },
    {
      title: 'CSS Minifier',
      description: 'Minify CSS files by removing whitespace and comments.',
      route: '/css-minifier',
      icon: 'pi pi-file'
    }
  ];
  
  constructor(
    private router: Router,
    private pageTitleService: PageTitleService,
    private metaService: Meta,
    private titleService: Title
  ) { }
  
  ngOnInit() {
    // Set page title
    this.pageTitleService.setTitle('Web Developer Tools');
    
    // SEO settings
    this.setupSeo();
  }
  
  // Navigate to selected feature
  navigateToFeature(route: string) {
    this.router.navigate([route]);
  }
  
  // Setup SEO for dashboard
  private setupSeo() {
    this.titleService.setTitle('DevTools - Web Developer Utilities');
    
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Free online tools for developers including JSON formatter, JSON to XML converter, and more. Improve your workflow with these handy utilities.' 
    });
    
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: 'developer tools, JSON formatter, JSON to XML, web development utilities, code tools' 
    });
    
    // Open Graph meta tags for better sharing
    this.metaService.updateTag({ property: 'og:title', content: 'Web Developer Tools | DevTools' });
    this.metaService.updateTag({ property: 'og:description', content: 'Collection of free online tools for web developers. Format JSON, convert data formats, and more.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'DevTools' });
  }
} 