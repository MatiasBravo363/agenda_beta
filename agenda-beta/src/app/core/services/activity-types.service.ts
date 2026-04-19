import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { TipoActividad } from '../models';

@Injectable({ providedIn: 'root' })
export class ActivityTypesService {
  private sb = inject(SupabaseService);
  private readonly table = 'tipos_actividad';

  async list(): Promise<TipoActividad[]> {
    const { data, error } = await this.sb.client.from(this.table).select('*').order('nombre');
    if (error) throw error;
    return data as TipoActividad[];
  }

  async create(payload: Omit<TipoActividad, 'id'>): Promise<TipoActividad> {
    const { data, error } = await this.sb.client.from(this.table).insert(payload).select('*').single();
    if (error) throw error;
    return data as TipoActividad;
  }

  async update(id: string, payload: Partial<TipoActividad>): Promise<TipoActividad> {
    const { data, error } = await this.sb.client.from(this.table).update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return data as TipoActividad;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }
}
