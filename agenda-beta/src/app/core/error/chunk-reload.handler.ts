import { ErrorHandler, Injectable } from '@angular/core';

// Cuando Vercel (u otro CDN) sirve un deploy nuevo, los chunks lazy con nombres
// hashados anteriores dejan de existir. Si el usuario tenía la SPA abierta y
// navega a una ruta con `loadComponent`/`loadChildren`, el dynamic import tira
// "Failed to fetch dynamically imported module". El handler detecta ese error
// y fuerza un reload para que el browser baje el index.html nuevo con los
// hashes actuales. El flag en sessionStorage previene loop infinito si el
// reload no soluciona el problema.
const FLAG_KEY = 'chunk-reload-at';
const COOLDOWN_MS = 30_000;

const PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Loading chunk [\w\d-]+ failed/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
];

@Injectable({ providedIn: 'root' })
export class ChunkReloadErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const msg = this.extractMessage(error);
    if (msg && PATTERNS.some((re) => re.test(msg))) {
      const last = Number(sessionStorage.getItem(FLAG_KEY) ?? 0);
      if (Date.now() - last > COOLDOWN_MS) {
        sessionStorage.setItem(FLAG_KEY, String(Date.now()));
        window.location.reload();
        return;
      }
    }
    console.error(error);
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
