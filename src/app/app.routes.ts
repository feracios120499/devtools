import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, title: 'DevTools - Web Developer Utilities' },
  { 
    path: 'json-formatter', 
    loadComponent: () => import('./pages/json-formatter/json-formatter.component').then(m => m.JsonFormatterComponent),
    title: 'JSON Formatter, Beautifier & Viewer Online | DevTool' 
  },
  { 
    path: 'json-to-xml', 
    loadComponent: () => import('./pages/json-to-xml/json-to-xml.component').then(m => m.JsonToXmlComponent),
    title: 'JSON to XML Converter | DevTools' 
  },
  { 
    path: 'xml-formatter', 
    loadComponent: () => import('./pages/xml-formatter/xml-formatter.component').then(m => m.XmlFormatterComponent),
    title: 'XML Formatter, Beautifier & Viewer Online | DevTools' 
  },
  { 
    path: 'json-to-env', 
    loadComponent: () => import('./pages/json-to-env/json-to-env.component').then(m => m.JsonToEnvComponent),
    title: 'JSON to ENV Converter | DevTools' 
  },
  { 
    path: 'json-query', 
    loadComponent: () => import('./pages/json-query/json-query.component').then(m => m.JsonQueryComponent),
    title: 'JSON Query Explorer | DevTools' 
  },
  { 
    path: 'csv-viewer', 
    loadComponent: () => import('./pages/csv-viewer/csv-viewer.component').then(m => m.CsvViewerComponent),
    title: 'CSV Viewer and Analyzer | DevTools' 
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
  },
  { 
    path: 'base64-to-hex', 
    loadComponent: () => import('./pages/base64-to-hex/base64-to-hex.component').then(m => m.Base64ToHexComponent),
    title: 'Base64 to HEX Converter | Free & Fast Online Tool – DevTools' 
  },
  { 
    path: 'hex', 
    loadComponent: () => import('./pages/hex/hex.component').then(m => m.HexComponent),
    title: 'HEX Encoder/Decoder | DevTools' 
  },
  { 
    path: 'hex-to-file', 
    loadComponent: () => import('./pages/hex-to-file/hex-to-file.component').then(m => m.HexToFileComponent),
    title: 'HEX to File Converter | DevTools' 
  },
  { 
    path: 'hex-to-base64', 
    loadComponent: () => import('./pages/hex-to-base64/hex-to-base64.component').then(m => m.HexToBase64Component),
    title: 'HEX to Base64 Converter | DevTools' 
  },
  { 
    path: 'color-converter', 
    loadComponent: () => import('./pages/color-converter/color-converter.component').then(m => m.ColorConverterComponent),
    title: 'Color Converter | DevTools' 
  },
  { 
    path: 'image-color-picker', 
    loadComponent: () => import('./pages/image-color-picker/image-color-picker.component').then(m => m.ImageColorPickerComponent),
    title: 'Image Color Picker | DevTools' 
  },
  { 
    path: 'image-resize', 
    loadComponent: () => import('./pages/image-resize/image-resize.component').then(m => m.ImageResizeComponent),
    title: 'Image Resize | DevTools' 
  },
  { 
    path: 'image-compressor', 
    loadComponent: () => import('./pages/image-compressor/image-compressor.component').then(m => m.ImageCompressorComponent),
    title: 'Image Compressor | DevTools' 
  },
  { 
    path: 'image-format-converter', 
    loadComponent: () => import('./pages/image-format-converter/image-format-converter.component').then(m => m.ImageFormatConverterComponent),
    title: 'Image Format Converter | DevTools' 
  },
  { 
    path: 'jwt-decode', 
    loadComponent: () => import('./pages/jwt-decode/jwt-decode.component').then(m => m.JwtDecodeComponent),
    title: 'JWT Decoder and Verifier | DevTools' 
  },
  { 
    path: 'sql-formatter', 
    loadComponent: () => import('./pages/sql-formatter/sql-formatter.component').then(m => m.SqlFormatterComponent),
    title: 'SQL Formatter and Beautifier | DevTools' 
  },
  { 
    path: 'svg-to-react-component', 
    loadComponent: () => import('./pages/svg-to-react-component/svg-to-react-component.component').then(m => m.SvgToReactComponentComponent),
    title: 'SVG to React Component | DevTools' 
  },
  { 
    path: 'text-diff-checker', 
    loadComponent: () => import('./pages/text-compare/text-compare.component').then(m => m.TextCompareComponent),
    title: 'Text Diff Checker | DevTools' 
  },
  { 
    path: 'word-counter', 
    loadComponent: () => import('./pages/word-counter/word-counter.component').then(m => m.WordCounterComponent),
    title: 'Word Counter - Text Analysis Tool | DevTools' 
  },
  { 
    path: 'lorem-ipsum-generator', 
    loadComponent: () => import('./pages/lorem-ipsum-generator/lorem-ipsum-generator.component').then(m => m.LoremIpsumGeneratorComponent),
    title: 'Lorem Ipsum Generator - Placeholder Text Tool | DevTools' 
  },
  { 
    path: 'markdown-preview', 
    loadComponent: () => import('./pages/markdown-preview/markdown-preview.component').then(m => m.MarkdownPreviewComponent),
    title: 'Markdown Preview - Real-time Markdown Renderer | DevTools' 
  },
  { 
    path: '404', 
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - 404 | DevTools' 
  },
  { 
    path: '**', 
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - 404 | DevTools' 
  }
];
