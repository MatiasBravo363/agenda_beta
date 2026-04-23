import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { TipoVisita } from '../models';

@Injectable({ providedIn: 'root' })
export class TiposVisitaService {
  private sb = inject(SupabaseService);
  private readonly table = 'tipos_visita';

  async list(): Promise<TipoVisita[]> {
    const { data, error } = await this.sb.client.from(this.table).select('*').order('nombre');
    if (error) throw error;
    return data as TipoVisita[];
  }

  async create(payload: Omit<TipoVisita, 'id'>): Promise<TipoVisita> {
    const { data, error } = await this.sb.client.from(this.table).insert(payload).select('*').single();
    if (error) throw error;
    return data as TipoVisita;
  }

  async update(id: string, payload: Partial<TipoVisita>): Promise<TipoVisita> {
    const { data, error } = await this.sb.client.from(this.table).update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return data as TipoVisita;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }
}
