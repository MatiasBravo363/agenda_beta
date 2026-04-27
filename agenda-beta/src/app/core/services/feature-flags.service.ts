import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout_percent: number;
  description: string | null;
}

const TTL_MS = 60_000;

/**
 * Cache de feature flags consultando public.feature_flags (migración 018).
 * Lectura abierta a cualquier autenticado; escritura solo super_admin via SQL.
 *
 * Uso típico desde un componente:
 *   if (this.flags.isEnabled('ui_paginacion_visible')) { ... }
 *
 * O en template con la directiva:
 *   <div *appFeature="'dashboard_v2'">...</div>
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private sb = inject(SupabaseService);

  private flagsSig = signal<Record<string, FeatureFlag>>({});
  private loadedAt = 0;
  private inflight: Promise<void> | null = null;

  readonly flags = computed(() => Object.values(this.flagsSig()));

  isEnabled(key: string): boolean {
    const f = this.flagsSig()[key];
    if (!f) return false;
    return f.enabled;
  }

  /**
   * Carga la tabla feature_flags. Cachea por TTL_MS; llamadas concurrentes
   * comparten la misma promise. Devuelve sin esperar si el cache está fresco.
   */
  async load(force = false): Promise<void> {
    const fresh = Date.now() - this.loadedAt < TTL_MS;
    if (!force && fresh && Object.keys(this.flagsSig()).length > 0) return;
    if (this.inflight) return this.inflight;

    this.inflight = (async () => {
      try {
        const { data, error } = await this.sb.client
          .from('feature_flags')
          .select('key, enabled, rollout_percent, description');
        if (error) throw error;
        const map: Record<string, FeatureFlag> = {};
        for (const f of data ?? []) {
          map[f.key] = f as FeatureFlag;
        }
        this.flagsSig.set(map);
        this.loadedAt = Date.now();
      } finally {
        this.inflight = null;
      }
    })();
    return this.inflight;
  }

  /** Útil para testing: setea flags manualmente sin pegarle a Supabase. */
  setForTesting(flags: Record<string, FeatureFlag>): void {
    this.flagsSig.set(flags);
    this.loadedAt = Date.now();
  }
}
