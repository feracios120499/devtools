import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Monaco будет загружаться через отдельный загрузчик
// Именно из отдельного скрипта, а не здесь

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
