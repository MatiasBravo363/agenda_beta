import { Component, OnInit, inject, signal } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { environment } from '../../../environments/environment';

const APP_VERSION = '1.0.13';
const PING_TIMEOUT_MS = 5000;

type CheckStatus = 'ok' | 'down' | 'unknown' | 'checking';

interface Check {
  label: string;
  status: CheckStatus;
  detail?: string;
}

/**
 * Página pública de health-check. Muestra estado de la app, Supabase y Sentry
 * para que un usuario pueda distinguir "la plataforma está caída" de "es mi
 * red". Renderiza minimal sin sidebar y no requiere autenticación.
 */
@Component({
  selector: 'app-status',
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div class="card max-w-lg w-full p-8 space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Estado del sistema</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            agenda-beta@{{ version }} · {{ now }}
          </p>
        </div>

        <ul class="space-y-3">
          @for (c of checks(); track c.label) {
            <li class="flex items-center justify-between gap-3 p-3 rounded-md border border-slate-200 dark:border-slate-700">
              <span class="text-slate-700 dark:text-slate-200">{{ c.label }}</span>
              <span
                class="text-sm font-medium px-2.5 py-1 rounded-full"
                [class.bg-green-100]="c.status === 'ok'"
                [class.text-green-800]="c.status === 'ok'"
                [class.bg-red-100]="c.status === 'down'"
                [class.text-red-800]="c.status === 'down'"
                [class.bg-slate-100]="c.status === 'checking' || c.status === 'unknown'"
                [class.text-slate-700]="c.status === 'checking' || c.status === 'unknown'"
              >
                @switch (c.status) {
                  @case ('ok') { OK }
                  @case ('down') { Caído }
                  @case ('checking') { Chequeando… }
                  @default { — }
                }
                @if (c.detail) { · {{ c.detail }} }
              </span>
            </li>
          }
        </ul>

        <button class="btn-secondary w-full" (click)="check()" [disabled]="cargando()">
          {{ cargando() ? 'Chequeando…' : 'Volver a chequear' }}
        </button>

        <p class="text-xs text-slate-400 text-center">
          Si Supabase aparece como "Caído", revisá <a class="underline" href="https://status.supabase.com" target="_blank" rel="noopener">status.supabase.com</a>.
        </p>
      </div>
    </div>
  `,
})
export class StatusComponent implements OnInit {
  private sb = inject(SupabaseService);

  version = APP_VERSION;
  now = new Date().toLocaleString('es-CL');
  cargando = signal(false);
  checks = signal<Check[]>([
    { label: 'Frontend', status: 'ok' },
    { label: 'Supabase (PostgREST)', status: 'unknown' },
    { label: 'Sentry (DSN)', status: environment.sentryDsn ? 'ok' : 'unknown', detail: environment.sentryDsn ? 'configurado' : 'sin DSN' },
  ]);

  async ngOnInit(): Promise<void> {
    await this.check();
  }

  async check(): Promise<void> {
    this.cargando.set(true);
    this.now = new Date().toLocaleString('es-CL');
    this.updateCheck('Supabase (PostgREST)', { status: 'checking' });

    try {
      const ping = this.sb.client.from('schema_version').select('version').limit(1);
      const timeout = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('timeout')), PING_TIMEOUT_MS),
      );
      const { error } = await Promise.race([ping, timeout]);
      if (error) throw error;
      this.updateCheck('Supabase (PostgREST)', { status: 'ok' });
    } catch (e: unknown) {
      const detail = (e as { message?: string })?.message ?? 'sin respuesta';
      this.updateCheck('Supabase (PostgREST)', { status: 'down', detail });
    } finally {
      this.cargando.set(false);
    }
  }

  private updateCheck(label: string, patch: Partial<Check>): void {
    this.checks.update((list) =>
      list.map((c) => (c.label === label ? { ...c, ...patch } : c)),
    );
  }
}
