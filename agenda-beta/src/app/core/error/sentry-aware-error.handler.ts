import { ErrorHandler, Injectable, inject } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { ChunkReloadErrorHandler } from './chunk-reload.handler';

const CHUNK_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Loading chunk [\w\d-]+ failed/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
];

@Injectable({ providedIn: 'root' })
export class SentryAwareErrorHandler implements ErrorHandler {
  private readonly chunkHandler = inject(ChunkReloadErrorHandler);

  handleError(error: unknown): void {
    const msg = this.extractMessage(error);
    const isChunkError = !!msg && CHUNK_PATTERNS.some((re) => re.test(msg));

    if (isChunkError) {
      this.chunkHandler.handleError(error);
      return;
    }

    Sentry.captureException(error);

    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(error);
    }
  }

  private extractMessage(error: unknown): string {
    if (!error) return '';
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return (error as { message?: string }).message ?? String(error);
    } catch {
      return '';
    }
  }
}
