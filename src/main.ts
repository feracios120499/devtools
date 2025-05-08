import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Monaco будет загружаться через отдельный загрузчик
// Именно из отдельного скрипта, а не здесь
if (typeof window !== 'undefined') {
  (window as any).MonacoEnvironment = {
    getWorker: function (_moduleId: any, label: string) {
      const path = './assets/monaco/esm/vs';

      switch (label) {
        case 'json':
          return new Worker(`${path}/language/json/json.worker.js`, { type: 'module' });
        case 'css':
          return new Worker(`${path}/language/css/css.worker.js`, { type: 'module' });
        case 'html':
          return new Worker(`${path}/language/html/html.worker.js`, { type: 'module' });
        case 'typescript':
        case 'javascript':
          return new Worker(`${path}/language/typescript/ts.worker.js`, { type: 'module' });
        default:
          return new Worker(`${path}/editor/editor.worker.js`, { type: 'module' });
      }
    }
  };
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
