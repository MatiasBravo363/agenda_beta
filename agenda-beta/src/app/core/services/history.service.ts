import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { ActividadHistorial } from '../models';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private sb = inject(SupabaseService);
  private readonly table = 'actividades_historial';

  async list(): Promise<ActividadHistorial[]> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .select('*, actividad:actividades(*, tecnico:tecnicos(*), tipo_actividad:tipos_actividad(*)), usuario:usuarios(*)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []) as unknown as ActividadHistorial[];
  }
}
