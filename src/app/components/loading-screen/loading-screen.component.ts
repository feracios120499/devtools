import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LoadingService } from '../../services/loading.service';
import { Observable } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- 
      Компонент загрузки отключен в браузере, т.к. вместо него используется 
      начальный лоадер из index.html для избежания двойного мерцания
    -->
    <div 
      *ngIf="!isBrowser && (isLoading$ | async)" 
      class="loading-screen" 
      [@fadeAnimation]>
      <div class="loading-container">
        <div class="logo">DevTools</div>
        <div class="spinner"></div>
        <h2 class="loading-text">Loading...</h2>
      </div>
    </div>
  `,
  styles: [`
    .loading-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--surface-ground, #121212);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      opacity: 1;
      transition: opacity 0.5s;
      backdrop-filter: blur(5px);
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    
    .logo {
      font-size: 2.5rem;
      font-weight: bold;
      color: var(--primary-color, #4ade80);
      margin-bottom: 1rem;
      text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
    }
    
    .spinner {
      width: 60px;
      height: 60px;
      border: 5px solid rgba(74, 222, 128, 0.2);
      border-radius: 50%;
      border-top-color: var(--primary-color, #4ade80);
      animation: spin 1s ease-in-out infinite;
      box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
    }
    
    .loading-text {
      color: var(--primary-color, #4ade80);
      font-size: 1.5rem;
      margin: 0;
      font-weight: 500;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  animations: [
    trigger('fadeAnimation', [
      transition(':leave', [
        style({ opacity: 1 }),
        animate('500ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoadingScreenComponent implements OnInit {
  isLoading$: Observable<boolean>;
  isBrowser: boolean;
  
  constructor(
    private loadingService: LoadingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isLoading$ = this.loadingService.isLoading$;
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  
  ngOnInit(): void {
    // Дополнительная логика инициализации, если необходима
  }
} 