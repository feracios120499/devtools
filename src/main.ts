import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Добавим конфигурацию Monaco Editor для правильной загрузки воркеров
(window as any).MonacoEnvironment = {
  getWorkerUrl: function(_moduleId: any, label: string) {
    if (label === 'json') {
      return '/assets/monaco/vs/language/json/jsonWorker.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return '/assets/monaco/vs/language/css/cssWorker.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return '/assets/monaco/vs/language/html/htmlWorker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return '/assets/monaco/vs/language/typescript/tsWorker.js';
    }
    return '/assets/monaco/vs/editor/editor.worker.js';
  }
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
