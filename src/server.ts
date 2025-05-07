import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

// Определение путей к файлам
const currentFilePath = fileURLToPath(import.meta.url);
const serverDistFolder = dirname(currentFilePath);
const browserDistFolder = resolve(serverDistFolder, '../browser');

// Отладочная информация
console.log('Current file path:', currentFilePath);
console.log('Server dist folder:', serverDistFolder);
console.log('Browser dist folder:', browserDistFolder);
console.log('Browser folder exists:', fs.existsSync(browserDistFolder));

// Если папка browser не существует, попробуем найти ее по-другому
let finalBrowserDistFolder = browserDistFolder;
if (!fs.existsSync(browserDistFolder)) {
  const alternativePath = resolve(process.cwd(), 'dist/devtools/browser');
  console.log('Trying alternative browser folder:', alternativePath);
  console.log('Alternative folder exists:', fs.existsSync(alternativePath));
  
  if (fs.existsSync(alternativePath)) {
    finalBrowserDistFolder = alternativePath;
  }
}

// Логируем содержимое папки
if (fs.existsSync(finalBrowserDistFolder)) {
  console.log('Browser folder contents:', fs.readdirSync(finalBrowserDistFolder));
}

const app = express();
const angularApp = new AngularNodeAppEngine();

// Добавляем базовую диагностику запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  next();
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(finalBrowserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// Добавляем эндпоинт для проверки здоровья сервера
app.get('/health', (req, res) => {
  res.status(200).send({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'] || 'development',
    port: process.env['PORT'] || '4000',
    serverPath: serverDistFolder,
    browserPath: finalBrowserDistFolder
  });
});

// Serve robots.txt and sitemap.xml at the root level
app.get('/robots.txt', (req, res) => {
  res.sendFile(resolve(finalBrowserDistFolder, 'assets/robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(resolve(finalBrowserDistFolder, 'assets/sitemap.xml'));
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('*', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        console.log(`[${new Date().toISOString()}] Rendering SSR response for ${req.url}`);
        return writeResponseToNodeResponse(response, res);
      } else {
        console.log(`[${new Date().toISOString()}] No SSR response for ${req.url}, falling back`);
        
        // Если SSR не отработал, возвращаем index.html
        if (fs.existsSync(join(finalBrowserDistFolder, 'index.html'))) {
          console.log(`[${new Date().toISOString()}] Sending index.html as fallback`);
          return res.sendFile(join(finalBrowserDistFolder, 'index.html'));
        }
        
        next();
      }
    })
    .catch((error) => {
      console.error(`[${new Date().toISOString()}] Error handling request:`, error);
      
      // В случае ошибки, возвращаем index.html как fallback
      if (fs.existsSync(join(finalBrowserDistFolder, 'index.html'))) {
        console.log(`[${new Date().toISOString()}] Sending index.html as error fallback`);
        return res.sendFile(join(finalBrowserDistFolder, 'index.html'));
      }
      
      next(error);
    });
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
    console.log('Application environment:', process.env['NODE_ENV'] || 'development');
    console.log('Current working directory:', process.cwd());
    console.log('Process arguments:', process.argv);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
