import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Tecnico } from '../models';

@Injectable({ providedIn: 'root' })
export class TechniciansService {
  private sb = inject(SupabaseService);
  private readonly table = 'tecnicos';

  async list(): Promise<Tecnico[]> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data as Tecnico[];
  }

  async getById(id: string): Promise<Tecnico | null> {
    const { data, error } = await this.sb.client.from(this.table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Tecnico | null;
  }

  async create(payload: Omit<Tecnico, 'id' | 'created_at'>): Promise<Tecnico> {
    const { data, error } = await this.sb.client.from(this.table).insert(payload).select('*').single();
    if (error) throw error;
    return data as Tecnico;
  }

  async update(id: string, payload: Partial<Tecnico>): Promise<Tecnico> {
    const { data, error } = await this.sb.client.from(this.table).update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Tecnico;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }
}
