import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, title: 'DevTools - Web Developer Utilities' },
  { 
    path: 'json-formatter', 
    loadComponent: () => import('./pages/json-formatter/json-formatter.component').then(m => m.JsonFormatterComponent),
    title: 'JSON Formatter and Validator | DevTools' 
  },
  { 
    path: 'json-to-xml', 
    loadComponent: () => import('./pages/json-to-xml/json-to-xml.component').then(m => m.JsonToXmlComponent),
    title: 'JSON to XML Converter | DevTools' 
  },
  { 
    path: 'url-encoder', 
    loadComponent: () => import('./pages/url-encoder/url-encoder.component').then(m => m.UrlEncoderComponent),
    title: 'URL Encoder and Decoder | DevTools' 
  }
];
