import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Actividad, EstadoActividad } from '../models';

const SELECT_WITH_REL = '*, tecnico:tecnicos(*), tipo_actividad:tipos_actividad(*)';

const UPDATABLE_FIELDS: (keyof Actividad)[] = [
  'nombre_cliente',
  'tipo_actividad_id',
  'tecnico_id',
  'fecha_inicio',
  'fecha_fin',
  'ubicacion',
  'descripcion',
  'estado',
  'parent_activity_id',
];

function toPayload(src: Partial<Actividad>): Partial<Actividad> {
  const out: any = {};
  for (const k of UPDATABLE_FIELDS) {
    if (k in src) out[k] = (src as any)[k];
  }
  return out;
}

@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  private sb = inject(SupabaseService);
  private readonly table = 'actividades';

  async list(): Promise<Actividad[]> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .select(SELECT_WITH_REL)
      .order('fecha_inicio', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as unknown as Actividad[];
  }

  async getById(id: string): Promise<Actividad | null> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .select(SELECT_WITH_REL)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Actividad) ?? null;
  }

  async create(payload: Partial<Actividad>): Promise<Actividad> {
    const { data: userData } = await this.sb.client.auth.getUser();
    const body: any = { ...toPayload(payload), created_by: userData.user?.id ?? null };
    const { data, error } = await this.sb.client
      .from(this.table)
      .insert(body)
      .select(SELECT_WITH_REL)
      .single();
    if (error) throw error;
    return data as unknown as Actividad;
  }

  async update(id: string, payload: Partial<Actividad>): Promise<Actividad> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .update(toPayload(payload))
      .eq('id', id)
      .select(SELECT_WITH_REL)
      .single();
    if (error) throw error;
    return data as unknown as Actividad;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }

  /** Clona una actividad (el original suele quedar en 'visita_fallida'). */
  async clone(originalId: string, nuevoEstado: EstadoActividad = 'coordinado_con_cliente'): Promise<Actividad> {
    const original = await this.getById(originalId);
    if (!original) throw new Error('Actividad original no encontrada');
    const {
      id: _id,
      created_at: _c,
      updated_at: _u,
      tecnico: _t,
      tipo_actividad: _ta,
      ...rest
    } = original;
    const payload: Partial<Actividad> = {
      ...rest,
      estado: nuevoEstado,
      parent_activity_id: original.id,
      tecnico_id: null,
      fecha_inicio: null,
      fecha_fin: null,
    };
    return this.create(payload);
  }

  async changeStatus(id: string, estado_nuevo: EstadoActividad, comentario?: string): Promise<Actividad> {
    const actual = await this.getById(id);
    if (!actual) throw new Error('Actividad no encontrada');
    const updated = await this.update(id, { estado: estado_nuevo });
    const { data: userData } = await this.sb.client.auth.getUser();
    await this.sb.client.from('actividades_historial').insert({
      actividad_id: id,
      estado_anterior: actual.estado,
      estado_nuevo,
      comentario: comentario ?? null,
      usuario_id: userData.user?.id ?? null,
    });
    return updated;
  }
}
