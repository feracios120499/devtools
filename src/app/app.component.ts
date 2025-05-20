import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from './layouts/topbar/topbar.component';
import { LeftbarComponent } from './layouts/leftbar/leftbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopbarComponent,
    LeftbarComponent
  ],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'devtools';
  
  constructor() {}
  
  ngOnInit() {
  }
  
  
  
  ngAfterViewInit() {
    // Метод оставлен для совместимости с интерфейсом
  }
}
