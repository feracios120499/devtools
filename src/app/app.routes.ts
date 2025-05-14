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
  },
  { 
    path: 'url-to-qr', 
    loadComponent: () => import('./pages/url-to-qr/url-to-qr.component').then(m => m.UrlToQrComponent),
    title: 'URL to QR Code Generator | DevTools' 
  },
  { 
    path: 'base64', 
    loadComponent: () => import('./pages/base64/base64.component').then(m => m.Base64Component),
    title: 'Base64 Encoder and Decoder | DevTools' 
  },
  { 
    path: 'base64-to-file', 
    loadComponent: () => import('./pages/base64-to-file/base64-to-file.component').then(m => m.Base64ToFileComponent),
    title: 'Base64 to File Converter | DevTools' 
  }
];
