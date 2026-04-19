import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Actividad, EstadoActividad } from '../models';

const SELECT_WITH_REL = '*, tecnico:tecnicos(*), tipo_actividad:tipos_actividad(*), creado_por:usuarios!created_by(*)';

const UPDATABLE_FIELDS: (keyof Actividad)[] = [
  'nombre_cliente',
  'tipo_actividad_id',
  'tecnico_id',
  'fecha_inicio',
  'fecha_fin',
  'ubicacion',
  'ubicacion_lat',
  'ubicacion_lng',
  'descripcion',
  'estado',
  'parent_activity_id',
  'cantidad_pendiente',
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

  async setCantidadPendiente(id: string, cantidad: number): Promise<void> {
    const { error } = await this.sb.client
      .from(this.table)
      .update({ cantidad_pendiente: cantidad })
      .eq('id', id);
    if (error) throw error;
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

  async changeStatus(id: string, estado_nuevo: EstadoActividad): Promise<Actividad> {
    return this.update(id, { estado: estado_nuevo });
  }
}
