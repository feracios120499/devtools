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

// Кеширование статических файлов
interface CacheEntry {
  content: Buffer;
  contentType: string;
  timestamp: number;
  etag: string;
}

const staticCache: Record<string, CacheEntry> = {};
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
const CACHE_MAX_SIZE = 100; // Максимальное количество файлов в кеше

// Версия кеша (соль), меняйте при выкатывании обновлений
// Можно управлять через переменную окружения для удобства деплоя
const CACHE_VERSION = process.env['CACHE_VERSION'] || '1.0.0';

// Функция для создания ключа кеша с учетом версии приложения
function createCacheKey(url: string): string {
  return `${CACHE_VERSION}:${url}`;
}

// Функция для определения типа содержимого по расширению файла
function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const contentTypes: Record<string, string> = {
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'ico': 'image/x-icon',
    'map': 'application/json'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

// Функция для очистки кеша при превышении максимального размера
function cleanupCache(): void {
  const cacheEntries = Object.entries(staticCache);
  if (cacheEntries.length > CACHE_MAX_SIZE) {
    // Сортируем по времени последнего доступа и удаляем старые записи
    const sortedEntries = cacheEntries.sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );
    
    // Удаляем 20% самых старых записей
    const entriesToRemove = Math.ceil(CACHE_MAX_SIZE * 0.2);
    for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
      delete staticCache[sortedEntries[i][0]];
    }
    
    console.log(`[${new Date().toISOString()}] Cache cleanup: removed ${entriesToRemove} entries`);
  }
}

const app = express();
const angularApp = new AngularNodeAppEngine();

// Добавляем базовую диагностику запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Редирект со старого домена на новый (301 постоянный редирект)
app.use((req, res, next) => {
  const host = req.headers.host?.toLowerCase();
  
  if (host === 'onlinedevtools.it.com' || host?.includes('onlinedevtools.it.com')) {
    const newUrl = `https://onlinewebdevtools.com${req.originalUrl}`;
    console.log(`[${new Date().toISOString()}] Redirecting from ${host}${req.originalUrl} to ${newUrl}`);
    return res.redirect(301, newUrl);
  }
  
  next();
});

// ВАЖНО: Эндпоинты для проверки здоровья должны быть определены раньше других маршрутов
// Главный маршрут проверки здоровья для Render - должен отвечать с кодом 200
app.get('/', (req, res, next) => {
  // Проверяем, является ли это запросом от Render для проверки здоровья
  const isHealthCheck = req.headers['user-agent']?.includes('Render') || 
                        req.headers['x-forwarded-for'] === '::1' ||
                        req.ip === '::1' ||
                        req.ip === '::ffff:127.0.0.1';

  if (isHealthCheck) {
    console.log(`[${new Date().toISOString()}] Health check detected on / - responding with 200 OK`);
    return res.status(200).send('OK - Health Check Passed');
  }
  
  // Если это не проверка здоровья, передаем управление следующему обработчику
  next();
  return; // Явно указываем return для удовлетворения линтера
});

// Отдельный эндпоинт здоровья для диагностики
app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check on /health`);
  res.status(200).send({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'] || 'development',
    port: process.env['PORT'] || '4000',
    serverPath: serverDistFolder,
    browserPath: finalBrowserDistFolder,
    cacheSize: Object.keys(staticCache).length,
    cacheVersion: CACHE_VERSION
  });
});

// Специальные роуты для статических ресурсов, которые должны быть обработаны ДО express.static
// Это нужно для решения проблем с Monaco Editor

// Обработчик для всех статических ресурсов
app.get([
  // Все расширения файлов
  '/**/*.js', '/**/*.css', '/**/*.map', '/**/*.ico', 
  '/**/*.png', '/**/*.jpg', '/**/*.jpeg', '/**/*.gif', 
  '/**/*.svg', '/**/*.woff', '/**/*.woff2', '/**/*.ttf', '/**/*.eot',
  // Специфичные пути для Monaco
  '/assets/monaco/**', '/assets/min-maps/**', '/vs/**', '/language/**', 'assets/**'
], (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Static resource requested: ${req.url}`);
  
  // Проверяем кеш
  const cacheKey = createCacheKey(req.url);
  const cachedEntry = staticCache[cacheKey];
  
  // Если есть в кеше и не устарел, возвращаем из кеша
  if (cachedEntry) {
    // Обновляем timestamp
    cachedEntry.timestamp = Date.now();
    
    // Проверяем ETag для условных запросов
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === cachedEntry.etag) {
      console.log(`[${new Date().toISOString()}] Cache hit (304): ${req.url}`);
      return res.status(304).end();
    }
    
    // Отдаем кешированный контент с правильными заголовками
    console.log(`[${new Date().toISOString()}] Cache hit: ${req.url}`);
    res.setHeader('Content-Type', cachedEntry.contentType);
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE / 1000}`);
    res.setHeader('ETag', cachedEntry.etag);
    return res.send(cachedEntry.content);
  }
  
  // Формируем абсолютный путь к файлу
  const filePath = join(finalBrowserDistFolder, req.url);
  
  // Проверяем существование файла
  if (fs.existsSync(filePath)) {
    console.log(`[${new Date().toISOString()}] Serving static file: ${filePath}`);
    
    try {
      // Читаем файл в память
      const content = fs.readFileSync(filePath);
      const contentType = getContentType(filePath);
      const etag = `W/"${content.length.toString(16)}"`; // Простой ETag на основе размера файла
      
      // Кешируем контент
      staticCache[cacheKey] = {
        content,
        contentType,
        timestamp: Date.now(),
        etag
      };
      
      // Проверка и очистка кеша если нужно
      cleanupCache();
      
      // Устанавливаем заголовки для кеширования
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE / 1000}`);
      res.setHeader('ETag', etag);
      
      return res.send(content);
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Error reading file ${filePath}:`, e);
      return res.sendFile(filePath); // Запасной вариант
    }
  }
  
  // Специальная обработка для Monaco ресурсов
  if (req.url.includes('/monaco/') || req.url.includes('/language/') || req.url.startsWith('/vs/')) {
    // Создаем массив возможных путей для проверки
    const pathsToCheck: string[] = [];
    
    // 1. Проверяем точный путь
    pathsToCheck.push(join(finalBrowserDistFolder, req.url));
    
    // 2. Если запрос к assets/monaco, проверяем также прямой путь без "assets/monaco"
    if (req.url.startsWith('/assets/monaco/')) {
      const relativePath = req.url.replace('/assets/monaco/', '');
      pathsToCheck.push(join(finalBrowserDistFolder, 'assets/monaco/vs', relativePath));
      pathsToCheck.push(join(finalBrowserDistFolder, 'assets/monaco', relativePath));
    }
    
    // 3. Если запрос к /vs, проверяем путь в assets/monaco
    if (req.url.startsWith('/vs/')) {
      pathsToCheck.push(join(finalBrowserDistFolder, 'assets/monaco', req.url));
    }
    
    // 4. Если запрос содержит /language/, проверяем в assets/monaco/vs/language
    if (req.url.includes('/language/')) {
      const parts = req.url.split('/language/');
      if (parts.length > 1) {
        pathsToCheck.push(join(finalBrowserDistFolder, 'assets/monaco/vs/language', parts[1]));
      }
    }
    
    // 5. Если запрос к jsonMode.js - специальный путь
    if (req.url.includes('jsonMode.js')) {
      pathsToCheck.push(join(finalBrowserDistFolder, 'assets/monaco/vs/language/json/jsonMode.js'));
    }
    
    // 6. Проверяем editor.main.css в разных местах
    if (req.url.includes('editor.main.css')) {
      pathsToCheck.push(join(finalBrowserDistFolder, 'assets/monaco/vs/editor/editor.main.css'));
    }
    
    // Логируем все пути, которые будем проверять
    console.log(`[${new Date().toISOString()}] Paths to check for ${req.url}:`, pathsToCheck);
    
    // Проверяем все пути
    for (const pathToCheck of pathsToCheck) {
      if (fs.existsSync(pathToCheck)) {
        console.log(`[${new Date().toISOString()}] Serving file from path: ${pathToCheck}`);
        
        try {
          // Читаем файл в память
          const content = fs.readFileSync(pathToCheck);
          const contentType = getContentType(pathToCheck);
          const etag = `W/"${content.length.toString(16)}"`; // Простой ETag на основе размера файла
          
          // Кешируем контент
          staticCache[cacheKey] = {
            content,
            contentType,
            timestamp: Date.now(),
            etag
          };
          
          // Проверка и очистка кеша если нужно
          cleanupCache();
          
          // Устанавливаем заголовки для кеширования
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE / 1000}`);
          res.setHeader('ETag', etag);
          
          return res.send(content);
        } catch (e) {
          console.error(`[${new Date().toISOString()}] Error reading file ${pathToCheck}:`, e);
          return res.sendFile(pathToCheck); // Запасной вариант
        }
      }
    }
    
    // Если ничего не нашли, логируем все содержимое папки assets/monaco
    console.log(`[${new Date().toISOString()}] Failed to find any matching file for ${req.url}`);
    try {
      const assetsMonacoVsPath = join(finalBrowserDistFolder, 'assets/monaco/vs');
      if (fs.existsSync(assetsMonacoVsPath)) {
        console.log(`[${new Date().toISOString()}] Contents of assets/monaco/vs:`, 
          fs.readdirSync(assetsMonacoVsPath));
        
        const editorPath = join(assetsMonacoVsPath, 'editor');
        if (fs.existsSync(editorPath)) {
          console.log(`[${new Date().toISOString()}] Contents of assets/monaco/vs/editor:`, 
            fs.readdirSync(editorPath));
        }
      }
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Error reading directory:`, e);
    }
  }
  
  console.log(`[${new Date().toISOString()}] Static file not found: ${filePath}`);
  next();
});

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

// Serve robots.txt and sitemap.xml at the root level
app.get('/robots.txt', (req, res) => {
  res.sendFile(resolve(finalBrowserDistFolder, 'assets/robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(resolve(finalBrowserDistFolder, 'assets/sitemap.xml'));
});

app.get('/Ads.txt', (req, res) => {
  res.sendFile(resolve(finalBrowserDistFolder, 'assets/Ads.txt'));
});

// Обработчик для Angular SSR
app.use('/**', (req, res, next) => {
  // Статические ресурсы должны быть уже обработаны предыдущими маршрутами
  console.log(`[${new Date().toISOString()}] SSR processing for route: ${req.url}`);
  
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        console.log(`[${new Date().toISOString()}] Rendering SSR response for ${req.url}`);
        return writeResponseToNodeResponse(response, res);
      } else {
        console.log(`[${new Date().toISOString()}] No SSR response for ${req.url}, falling back to index.html`);
        
        // Если SSR не отработал, возвращаем index.html
        if (fs.existsSync(join(finalBrowserDistFolder, 'index.html'))) {
          return res.sendFile(join(finalBrowserDistFolder, 'index.html'));
        }
        
        next();
        return; // Явно указываем return для удовлетворения линтера
      }
    })
    .catch((error) => {
      console.error(`[${new Date().toISOString()}] Error handling request:`, error);
      
      // В случае ошибки, возвращаем index.html как fallback
      if (fs.existsSync(join(finalBrowserDistFolder, 'index.html'))) {
        return res.sendFile(join(finalBrowserDistFolder, 'index.html'));
      }
      
      next(error);
      return; // Явно указываем return для удовлетворения линтера
    });
});

/**
 * Start the server if this module is the main entry point.
 * Важно прослушивать порт из переменной окружения PORT для Render.
 */
if (isMainModule(import.meta.url)) {
  // Получаем порт из переменной окружения или используем 4000 как запасной вариант
  const port = process.env['PORT'] || 4000;
  
  app.listen(port, () => {
    console.log(`=============================================`);
    console.log(`🚀 Node Express server listening on port ${port}`);
    console.log(`🔍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    console.log(`📁 Current working directory: ${process.cwd()}`);
    console.log(`📂 Browser files serving from: ${finalBrowserDistFolder}`);
    console.log(`=============================================`);
  });
}

/**
 * Request handler used by the Angular CLI or serverless functions.
 */
export const reqHandler = createNodeRequestHandler(app);
