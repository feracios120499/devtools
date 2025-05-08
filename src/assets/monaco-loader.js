// Monaco Loader для обходного пути проблем с SSR и зависимостями
(function() {
  // Проверяем, что мы в браузере
  if (typeof window === 'undefined') {
    return;
  }

  console.log('Monaco loader initializing...');

  // Базовый путь для Monaco - убираем слеш в начале, так как он может приводить к проблемам с путями
  var baseMonacoPath = 'assets/monaco';
  var mapsPath = 'assets/min-maps';

  // Убеждаемся, что путь не заканчивается на слеш
  if (baseMonacoPath.endsWith('/')) {
    baseMonacoPath = baseMonacoPath.slice(0, -1);
  }

  // Устанавливаем абсолютный путь исходя из текущего расположения
  var origin = window.location.origin;
  var absoluteBase = origin + '/' + baseMonacoPath;
  var absoluteMapsBase = origin + '/' + mapsPath;

  console.log('Monaco base path:', absoluteBase);
  console.log('Monaco maps path:', absoluteMapsBase);

  // Установка конфигурации Monaco Environment
  window.MonacoEnvironment = {
    getWorkerUrl: function(_moduleId, label) {
      var workerPath;
      if (label === 'json') {
        workerPath = absoluteBase + '/vs/language/json/jsonWorker.js';
      } else if (label === 'css' || label === 'scss' || label === 'less') {
        workerPath = absoluteBase + '/vs/language/css/cssWorker.js';
      } else if (label === 'html' || label === 'handlebars' || label === 'razor') {
        workerPath = absoluteBase + '/vs/language/html/htmlWorker.js';
      } else if (label === 'typescript' || label === 'javascript') {
        workerPath = absoluteBase + '/vs/language/typescript/tsWorker.js';
      } else {
        workerPath = absoluteBase + '/vs/editor/editor.worker.js';
      }
      console.log('Monaco requesting worker:', label, workerPath);
      return workerPath;
    }
  };

  // Функция для загрузки скрипта
  function loadScript(url) {
    console.log('Loading script:', url);
    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.onload = function() {
        console.log('Script loaded:', url);
        resolve();
      };
      script.onerror = function(error) {
        console.error('Script load error:', url, error);
        // Пробуем проверить доступность файла
        fetch(url)
          .then(function(response) {
            if (!response.ok) {
              console.error('Fetch failed:', response.status, response.statusText);
            }
          })
          .catch(function(fetchError) {
            console.error('Fetch error:', fetchError);
          });
        reject(error);
      };
      script.async = false; // Важно: загружаем синхронно, чтобы сохранить порядок
      script.src = url;
      document.head.appendChild(script);
    });
  }

  // Функция для загрузки CSS
  function loadCSS(url) {
    console.log('Loading CSS:', url);
    return new Promise(function(resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
      link.onload = function() {
        console.log('CSS loaded:', url);
        resolve();
      };
      link.onerror = function(error) {
        console.error('CSS load error:', url, error);
        reject(error);
      };
      document.head.appendChild(link);
    });
  }

  // Загружаем основной скрипт Monaco и CSS
  var loaderUrl = absoluteBase + '/vs/loader.js';
  var editorUrl = absoluteBase + '/vs/editor/editor.main.js';
  var cssUrl = absoluteBase + '/vs/editor/editor.main.css';

  // Сначала загружаем CSS
  loadCSS(cssUrl)
    .then(function() {
      // Затем загружаем loader.js
      return loadScript(loaderUrl);
    })
    .then(function() {
      console.log('Monaco loader.js loaded successfully');
      
      // Добавляем небольшую задержку перед загрузкой editor.main.js
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve();
        }, 100);
      });
    })
    .then(function() {
      // После загрузки loader.js, загружаем editor.main
      return loadScript(editorUrl);
    })
    .then(function() {
      console.log('Monaco editor.main.js loaded successfully');
      
      // Отправляем событие, что Monaco загружен
      if (window.monaco) {
        console.log('Monaco global object is available');
      } else {
        console.warn('Monaco global object not found after loading scripts');
      }

      var event = new CustomEvent('monaco-editor-loaded');
      window.dispatchEvent(event);
    })
    .catch(function(error) {
      console.error('Failed to load Monaco editor scripts:', error);
    });
})(); 