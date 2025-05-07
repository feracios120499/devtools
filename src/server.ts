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
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url} from ${req.ip}`);
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
    browserPath: finalBrowserDistFolder
  });
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

// Обработчик для Angular SSR
// Используем /** вместо * для более точного соответствия маршрутов
app.use('/**', (req, res, next) => {
  // Пропускаем запросы к статическим ресурсам
  if (req.url.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }

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
