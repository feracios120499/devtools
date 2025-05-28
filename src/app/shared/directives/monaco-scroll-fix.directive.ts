import { Directive, ElementRef, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[monacoScrollFix]',
  standalone: true
})
export class MonacoScrollFixDirective implements AfterViewInit, OnDestroy {
  private wheelListeners: (() => void)[] = [];
  private isBrowser: boolean;

  constructor(
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // Wait for Monaco Editor to be fully initialized
    setTimeout(() => {
      this.setupWheelEventHandlers();
    }, 500);
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    this.wheelListeners.forEach(removeListener => removeListener());
    this.wheelListeners = [];
  }

  /**
   * Setup wheel event handlers to allow page scrolling when cursor is in editor
   */
  private setupWheelEventHandlers(): void {
    const monacoEditorElements = this.elementRef.nativeElement.querySelectorAll('.monaco-editor');
    
    monacoEditorElements.forEach((editorElement: Element) => {
      this.setupEditorWheelHandler(editorElement);
    });
  }

  /**
   * Setup wheel handler for a specific editor element
   */
  private setupEditorWheelHandler(editorElement: Element): void {
    const wheelHandler = (event: Event) => {
      const wheelEvent = event as WheelEvent;
      const scrollableElement = editorElement.querySelector('.monaco-scrollable-element');
      
      if (scrollableElement) {
        const hasVerticalScroll = scrollableElement.scrollHeight > scrollableElement.clientHeight;
        const hasHorizontalScroll = scrollableElement.scrollWidth > scrollableElement.clientWidth;
        
        // If editor doesn't need scrolling, let the page handle the wheel event
        if (!hasVerticalScroll && !hasHorizontalScroll) {
          wheelEvent.stopPropagation();
          // Manually scroll the page
          window.scrollBy(0, wheelEvent.deltaY);
        }
      }
    };

    editorElement.addEventListener('wheel', wheelHandler, { passive: false });

    // Store the remove function for cleanup
    this.wheelListeners.push(() => {
      editorElement.removeEventListener('wheel', wheelHandler);
    });
  }

  /**
   * Get default Monaco Editor options with scroll fix
   */
  static getScrollFixOptions(): any {
    return {
      mouseWheelScrollSensitivity: 0.5,
      mouseWheelZoom: false,
      scrollbar: {
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        alwaysConsumeMouseWheel: false
      }
    };
  }
} 