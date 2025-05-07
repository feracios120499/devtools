import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { Subject, Subscription, debounceTime, fromEvent, takeUntil } from 'rxjs';

/**
 * Директива для отслеживания загрузки элементов DOM
 * Можно применять к изображениям, iframe и другим элементам, 
 * которые имеют события load
 */
@Directive({
  selector: '[appLoaded]',
  standalone: true
})
export class LoadedDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private loadSubscription?: Subscription;
  
  @Input() delayComplete = 0; // ms
  
  constructor(
    private el: ElementRef,
    private loadingService: LoadingService
  ) {}
  
  ngAfterViewInit(): void {
    // Подписываемся на событие загрузки
    const element = this.el.nativeElement;
    
    if (element.complete && element.tagName.toLowerCase() === 'img') {
      // Изображение уже загружено (из кэша)
      this.onLoadComplete();
    } else {
      // Подписываемся на событие загрузки
      this.loadSubscription = fromEvent(element, 'load')
        .pipe(
          takeUntil(this.destroy$),
          debounceTime(100) // Небольшая задержка для предотвращения частых вызовов
        )
        .subscribe(() => {
          this.onLoadComplete();
        });
      
      // Подписываемся на событие ошибки загрузки
      fromEvent(element, 'error')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          console.warn('Element load error:', element);
          this.onLoadComplete(); // Считаем загрузку завершенной, даже если с ошибкой
        });
    }
  }
  
  // Обработчик успешной загрузки
  private onLoadComplete(): void {
    if (this.delayComplete > 0) {
      setTimeout(() => {
        this.loadingService.completeLoading();
      }, this.delayComplete);
    } else {
      this.loadingService.completeLoading();
    }
  }
  
  // Отписываемся от всех подписок при уничтожении директивы
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.loadSubscription) {
      this.loadSubscription.unsubscribe();
    }
  }
} 