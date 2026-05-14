import { Injectable, signal } from '@angular/core';
import pkg from '../../../../package.json';

/**
 * Heartbeat de versión: detecta cuando el server tiene una versión nueva
 * deployada y la tab actual está corriendo código viejo.
 *
 * El bug que motivó esto: el 7-mayo-2026 una tab abierta hace 22 hs con
 * código pre-1.0.18 entró en loop infinito de UPDATEs sobre `visitas`,
 * generando 21k errores 40001/min. Sin un mecanismo de "reload forzado"
 * cuando hay deploy nuevo, este escenario puede repetirse en cualquier
 * release que tenga un bug y un usuario que no recargue la app.
 *
 * Cómo funciona:
 *   1. Al iniciar (app.component.ts > ngOnInit > VersionCheckService.iniciar()),
 *      hace fetch a /version.json (estático generado por scripts/generate-env.mjs).
 *   2. Compara la versión que devuelve el server con la del client (package.json).
 *   3. Si difieren → emite signal `actualizacionDisponible = true`.
 *      El UpdateBannerComponent lo lee y muestra el banner con countdown 30s.
 *   4. Re-chequea cada 30 min (setInterval) y al volver visible la tab
 *      (visibilitychange).
 */
@Injectable({ providedIn: 'root' })
export class VersionCheckService {
  private readonly clientVersion = (pkg as { version: string }).version;

  private readonly _actualizacionDisponible = signal(false);
  readonly actualizacionDisponible = this._actualizacionDisponible.asReadonly();

  private readonly _versionServer = signal<string | null>(null);
  readonly versionServer = this._versionServer.asReadonly();

  private interval: ReturnType<typeof setInterval> | null = null;
  private iniciado = false;

  iniciar(): void {
    if (this.iniciado) return;
    this.iniciado = true;
    this.check();
    this.interval = setInterval(() => this.check(), 30 * 60 * 1000);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  destruir(): void {
    if (this.interval) clearInterval(this.interval);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.iniciado = false;
  }

  private onVisibility = (): void => {
    if (document.visibilityState === 'visible') this.check();
  };

  private async check(): Promise<void> {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data: { version?: string } = await res.json();
      if (!data.version) return;
      this._versionServer.set(data.version);
      if (data.version !== this.clientVersion) {
        this._actualizacionDisponible.set(true);
      }
    } catch {
      /* silencioso: si el fetch falla (offline, server caído), no
         bloqueamos la app. El siguiente heartbeat reintenta. */
    }
  }
}
