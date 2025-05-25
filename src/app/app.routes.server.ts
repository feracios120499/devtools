import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'json-formatter',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'json-to-xml',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'json-to-env',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'json-query',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'csv-viewer',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'url-encoder',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'url-to-qr',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'base64',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'base64-to-file',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'base64-to-hex',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'hex',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'hex-to-file',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'hex-to-base64',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'color-converter',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'jwt-decode',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'sql-formatter',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'svg-to-react-component',
    renderMode: RenderMode.Prerender
  },
  {
    path: '404',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
