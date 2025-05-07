import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  private titleSignal = signal<string>('DevTools');
  
  constructor() {}
  
  /**
   * Set current page title
   */
  setTitle(title: string): void {
    this.titleSignal.set(title);
  }
  
  /**
   * Get current page title as a signal
   */
  getTitle(): Signal<string> {
    return this.titleSignal.asReadonly();
  }
} 