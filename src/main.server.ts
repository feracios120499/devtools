import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// Add a global empty monaco object for server-side rendering to prevent errors
// This will be replaced by the real monaco in the browser
(global as any).monaco = {
  editor: {},
  languages: {}
};

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
