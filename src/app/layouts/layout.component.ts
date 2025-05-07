import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from './topbar/topbar.component';
import { LeftbarComponent } from './leftbar/leftbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, LeftbarComponent],
  template: `
    <div class="layout-wrapper">
      <app-topbar></app-topbar>
      <div class="layout-content-wrapper">
        <app-leftbar></app-leftbar>
        <div class="layout-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: `
    .layout-wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }
    
    .layout-content-wrapper {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .layout-content {
      flex: 1;
      padding: 1rem;
      overflow: auto;
    }
  `
})
export class LayoutComponent {
} 