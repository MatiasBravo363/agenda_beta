import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Actividad, EstadoActividad, Tecnico, TipoActividad } from '../models';

const SELECT_WITH_REL =
  '*,' +
  ' tecnico:tecnicos!actividades_tecnico_id_fkey(*),' +
  ' tipo_actividad:tipos_actividad!actividades_tipo_actividad_id_fkey(*),' +
  ' creado_por:usuarios!created_by(*),' +
  ' tecnicos_rel:actividad_tecnicos(tecnico:tecnicos(*)),' +
  ' tipos_rel:actividad_tipos_actividad(tipo:tipos_actividad(*))';

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

type Raw = any;

function flattenRels(row: Raw): Actividad {
  if (!row) return row;
  const tecnicos: Tecnico[] = Array.isArray(row.tecnicos_rel)
    ? row.tecnicos_rel.map((r: any) => r.tecnico).filter(Boolean)
    : [];
  const tipos_actividad: TipoActividad[] = Array.isArray(row.tipos_rel)
    ? row.tipos_rel.map((r: any) => r.tipo).filter(Boolean)
    : [];
  const { tecnicos_rel, tipos_rel, ...rest } = row;
  return { ...rest, tecnicos, tipos_actividad } as Actividad;
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
    return (data ?? []).map(flattenRels);
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
    return data ? flattenRels(data) : null;
  }

  async create(payload: Partial<Actividad>): Promise<Actividad> {
    const tecnicosIds = this.resolveIds(payload.tecnicos_ids, payload.tecnico_id);
    const tiposIds = this.resolveIds(payload.tipos_actividad_ids, payload.tipo_actividad_id);
    const principalPayload: Partial<Actividad> = {
      ...payload,
      tecnico_id: tecnicosIds[0] ?? null,
      tipo_actividad_id: tiposIds[0] ?? null,
    };
    const { data: userData } = await this.sb.client.auth.getUser();
    const body: any = { ...toPayload(principalPayload), created_by: userData.user?.id ?? null };
    const { data, error } = await this.sb.client
      .from(this.table)
      .insert(body)
      .select(SELECT_WITH_REL)
      .single();
    if (error) throw error;
    const created = flattenRels(data);
    await this.syncPivote('actividad_tecnicos', created.id, 'tecnico_id', tecnicosIds);
    await this.syncPivote('actividad_tipos_actividad', created.id, 'tipo_actividad_id', tiposIds);
    return (await this.getById(created.id)) ?? created;
  }

  async update(id: string, payload: Partial<Actividad>): Promise<Actividad> {
    const tecnicosIds = this.resolveIds(payload.tecnicos_ids, payload.tecnico_id);
    const tiposIds = this.resolveIds(payload.tipos_actividad_ids, payload.tipo_actividad_id);
    const principalPayload: Partial<Actividad> = {
      ...payload,
      tecnico_id: tecnicosIds[0] ?? null,
      tipo_actividad_id: tiposIds[0] ?? null,
    };
    const { data, error } = await this.sb.client
      .from(this.table)
      .update(toPayload(principalPayload))
      .eq('id', id)
      .select(SELECT_WITH_REL)
      .single();
    if (error) throw error;
    await this.syncPivote('actividad_tecnicos', id, 'tecnico_id', tecnicosIds);
    await this.syncPivote('actividad_tipos_actividad', id, 'tipo_actividad_id', tiposIds);
    return (await this.getById(id)) ?? flattenRels(data);
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
      tecnicos,
      tipos_actividad,
      ...rest
    } = original;
    const tiposIds = (tipos_actividad ?? []).map((t) => t.id);
    const payload: Partial<Actividad> = {
      ...rest,
      estado: nuevoEstado,
      parent_activity_id: original.id,
      tecnico_id: null,
      tecnicos_ids: [],
      tipos_actividad_ids: tiposIds,
      fecha_inicio: null,
      fecha_fin: null,
    };
    return this.create(payload);
  }

  async changeStatus(id: string, estado_nuevo: EstadoActividad): Promise<Actividad> {
    return this.update(id, { estado: estado_nuevo });
  }

  // -----------------------------------------------------------------
  // Helpers internos
  // -----------------------------------------------------------------

  /** Devuelve una lista única de ids, filtrando null/undefined. Si no hay array pero sí un id simple, lo usa. */
  private resolveIds(arr: string[] | undefined, fallback: string | null | undefined): string[] {
    if (Array.isArray(arr)) return Array.from(new Set(arr.filter((x): x is string => !!x)));
    return fallback ? [fallback] : [];
  }

  /** Sincroniza un pivote: borra todos los rows de la actividad y reinsertar los ids dados. */
  private async syncPivote(
    table: 'actividad_tecnicos' | 'actividad_tipos_actividad',
    actividadId: string,
    colName: 'tecnico_id' | 'tipo_actividad_id',
    ids: string[],
  ): Promise<void> {
    const { error: delError } = await this.sb.client.from(table).delete().eq('actividad_id', actividadId);
    if (delError) throw delError;
    if (!ids.length) return;
    const rows = ids.map((id) => ({ actividad_id: actividadId, [colName]: id }));
    const { error: insError } = await this.sb.client.from(table).insert(rows);
    if (insError) throw insError;
  }
}
