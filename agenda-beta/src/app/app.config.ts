import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import * as Sentry from '@sentry/angular';

import { routes } from './app.routes';
import { SentryAwareErrorHandler } from './core/error/sentry-aware-error.handler';

registerLocaleData(localeEsCl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es-CL' },
    // Mantenemos SentryAwareErrorHandler (envuelve a ChunkReloadErrorHandler
    // y reporta a Sentry) en lugar de Sentry.createErrorHandler() para no
    // perder el auto-reload ante fallos de chunks lazy post-deploy.
    { provide: ErrorHandler, useClass: SentryAwareErrorHandler },
    // TraceService + APP_INITIALIZER siguen el patrón oficial de Sentry para
    // Angular. El envío real de spans está desactivado en sentry.init.ts
    // (tracesSampleRate: 0). Se mantienen registrados para que el wizard de
    // Sentry detecte el setup como completo y para activar tracing en el
    // futuro sin cambios estructurales.
    { provide: Sentry.TraceService, deps: [Router] },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
};
