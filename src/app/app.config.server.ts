import { provideServerRendering, withRoutes } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes)), providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,

        options: {
          darkModeSelector: '.my-app-dark',
        },
      },
    })],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
