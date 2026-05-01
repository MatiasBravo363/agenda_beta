import * as Sentry from '@sentry/angular';
import { environment } from '../../../environments/environment';

const APP_VERSION = '1.0.21';

const PII_KEYS = /password|token|authorization|api[-_]?key|secret/i;

function scrubObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const out: Record<string, unknown> = Array.isArray(obj) ? [] as unknown as Record<string, unknown> : {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_KEYS.test(key)) {
      out[key] = '[Filtered]';
    } else if (value && typeof value === 'object') {
      out[key] = scrubObject(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function initSentry(): void {
  if (!environment.sentryDsn) return;

  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
    release: `agenda-beta@${APP_VERSION}`,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i,
    ],
    ignoreErrors: [
      'Failed to fetch dynamically imported module',
      'Loading chunk',
      'Importing a module script failed',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
    beforeSend(event) {
      if (event.request?.data) {
        event.request.data = scrubObject(event.request.data);
      }
      if (event.extra) {
        event.extra = scrubObject(event.extra) as Record<string, unknown>;
      }
      if (event.contexts) {
        event.contexts = scrubObject(event.contexts) as typeof event.contexts;
      }
      return event;
    },
  });
}
