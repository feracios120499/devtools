import { Routes } from '@angular/router';
import { JsonFormatterComponent } from './pages/json-formatter/json-formatter.component';
import { JsonToXmlComponent } from './pages/json-to-xml/json-to-xml.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, title: 'DevTools - Web Developer Utilities' },
  { path: 'json-formatter', component: JsonFormatterComponent, title: 'JSON Formatter and Validator | DevTools' },
  { path: 'json-to-xml', component: JsonToXmlComponent, title: 'JSON to XML Converter | DevTools' }
];
