import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { VisitaHistorial } from '../models';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private sb = inject(SupabaseService);
  private readonly table = 'visitas_historial';

  async list(): Promise<VisitaHistorial[]> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .select('*, visita:visitas(*, tecnico:tecnicos(*), actividad:actividades(*)), usuario:usuarios(*)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []) as unknown as VisitaHistorial[];
  }
}
