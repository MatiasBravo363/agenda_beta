import { bootstrapApplication } from '@angular/platform-browser';
import { inject as vercelAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initSentry } from './app/core/error/sentry.init';
import { environment } from './environments/environment';

initSentry();

// Vercel Analytics + Speed Insights solo en producción para evitar
// pageviews y métricas falsas durante desarrollo local.
if (environment.production) {
  vercelAnalytics();
  injectSpeedInsights();
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
