import {
  Directive,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  Renderer2,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Directive({
  selector: '[anchorHeading]',
  standalone: true,
})
export class AnchorHeadingDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  private anchorLink: HTMLElement | null = null;
  private anchor: string = '';
  private isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const element = this.elementRef.nativeElement as HTMLElement;
    
    // Generate anchor from text content
    this.anchor = this.generateAnchor(element.textContent || '');
    
    // Set id attribute
    this.renderer.setAttribute(element, 'id', this.anchor);
    
    // Make element clickable
    this.renderer.setStyle(element, 'cursor', 'pointer');
    
    // Create anchor link
    this.createAnchorLink(element);
    
    // Check if we need to scroll to this element on page load
    this.checkAndScrollToAnchor();
  }

  ngOnDestroy(): void {
    if (this.anchorLink && this.elementRef?.nativeElement) {
      this.renderer.removeChild(this.elementRef.nativeElement, this.anchorLink);
    }
  }

  private generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with dashes
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }

  private createAnchorLink(element: HTMLElement): void {
    this.anchorLink = this.renderer.createElement('a');
    this.renderer.setAttribute(this.anchorLink, 'href', `#${this.anchor}`);
    this.renderer.setAttribute(this.anchorLink, 'aria-label', 'Link to this section');
    this.renderer.setStyle(this.anchorLink, 'margin-left', '0.5rem');
    this.renderer.setStyle(this.anchorLink, 'opacity', '0');
    this.renderer.setStyle(this.anchorLink, 'transition', 'opacity 0.2s ease');
    this.renderer.setStyle(this.anchorLink, 'color', 'var(--primary-color)');
    this.renderer.setStyle(this.anchorLink, 'text-decoration', 'none');
    this.renderer.setStyle(this.anchorLink, 'font-weight', 'bold');
    this.renderer.setStyle(this.anchorLink, 'font-size', '1.25rem');
    this.renderer.setStyle(this.anchorLink, 'line-height', '1');
    this.renderer.setStyle(this.anchorLink, 'display', 'inline');
    
    // Add the # symbol
    const linkText = this.renderer.createText('#');
    this.renderer.appendChild(this.anchorLink, linkText);
    
    // Append to element
    this.renderer.appendChild(element, this.anchorLink);
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.isBrowser || !this.anchorLink) return;
    this.renderer.setStyle(this.anchorLink, 'opacity', '1');
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!this.isBrowser || !this.anchorLink) return;
    this.renderer.setStyle(this.anchorLink, 'opacity', '0');
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.isBrowser) return;
    
    // Prevent default behavior
    event.preventDefault();
    
    // Update URL with anchor
    this.updateUrlWithAnchor();
    
    // Scroll to element
    this.scrollToElement();
  }

  private updateUrlWithAnchor(): void {
    const currentUrl = this.router.url.split('#')[0];
    const newUrl = `${currentUrl}#${this.anchor}`;
    
    // Update URL without triggering navigation
    window.history.replaceState(null, '', newUrl);
  }

  private scrollToElement(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    
    // // Smooth scroll to element with offset for fixed headers
    // element.scrollIntoView({
    //   behavior: 'smooth',
    //   block: 'start',
    // });
    
    // Additional offset for fixed headers (adjust as needed)
    setTimeout(() => {
      const yOffset = -80; // Adjust this value based on your header height
      const elementPosition = element.offsetTop
      console.log('elementPosition', elementPosition)
      const yPosition = Math.max(0, elementPosition + yOffset); // Ensure final position is not negative
      if(yPosition > 0) {
        const container = document.querySelector('.dt-page');
        if(container) {
          container.scrollTo({ top: yPosition, behavior: 'smooth' });
        }
      }
    }, 100);
  }

  private checkAndScrollToAnchor(): void {
    // Check if current URL has a hash that matches this element
    const hash = window.location.hash.substring(1);
    
    if (hash === this.anchor) {
      // Delay scroll to ensure page is fully loaded
      setTimeout(() => {
        this.scrollToElement();
      }, 300);
    }
  }
} 