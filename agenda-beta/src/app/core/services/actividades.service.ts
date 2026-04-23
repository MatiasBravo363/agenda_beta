import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Actividad } from '../models';

@Injectable({ providedIn: 'root' })
export class ActividadesService {
  private sb = inject(SupabaseService);
  private readonly table = 'actividades';

  async list(): Promise<Actividad[]> {
    const { data, error } = await this.sb.client.from(this.table).select('*').order('nombre');
    if (error) throw error;
    return data as Actividad[];
  }

  async create(payload: Omit<Actividad, 'id'>): Promise<Actividad> {
    const { data, error } = await this.sb.client.from(this.table).insert(payload).select('*').single();
    if (error) throw error;
    return data as Actividad;
  }

  async update(id: string, payload: Partial<Actividad>): Promise<Actividad> {
    const { data, error } = await this.sb.client.from(this.table).update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Actividad;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }
}
