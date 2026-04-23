import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { EstadoVisita, Tecnico, TipoVisita, Visita } from '../models';

const SELECT_WITH_REL =
  '*,' +
  ' tecnico:tecnicos!visitas_tecnico_id_fkey(*),' +
  ' tipo_visita:tipos_visita!visitas_tipo_visita_id_fkey(*),' +
  ' creado_por:usuarios!created_by(*),' +
  ' tecnicos_rel:visita_tecnicos(tecnico:tecnicos(*)),' +
  ' tipos_rel:visita_tipos_visita(tipo:tipos_visita(*))';

const UPDATABLE_FIELDS: (keyof Visita)[] = [
  'nombre_cliente',
  'tipo_visita_id',
  'tecnico_id',
  'fecha_inicio',
  'fecha_fin',
  'ubicacion',
  'ubicacion_lat',
  'ubicacion_lng',
  'descripcion',
  'estado',
  'parent_visita_id',
  'cantidad_pendiente',
];

function toPayload(src: Partial<Visita>): Partial<Visita> {
  const out: any = {};
  for (const k of UPDATABLE_FIELDS) {
    if (k in src) out[k] = (src as any)[k];
  }
  return out;
}

type Raw = any;

function flattenRels(row: Raw): Visita {
  if (!row) return row;
  const tecnicos: Tecnico[] = Array.isArray(row.tecnicos_rel)
    ? row.tecnicos_rel.map((r: any) => r.tecnico).filter(Boolean)
    : [];
  const tipos_visita: TipoVisita[] = Array.isArray(row.tipos_rel)
    ? row.tipos_rel.map((r: any) => r.tipo).filter(Boolean)
    : [];
  const { tecnicos_rel, tipos_rel, ...rest } = row;
  return { ...rest, tecnicos, tipos_visita } as Visita;
}

@Injectable({ providedIn: 'root' })
export class VisitasService {
  private sb = inject(SupabaseService);
  private readonly table = 'visitas';

  async list(): Promise<Visita[]> {
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

  async getById(id: string): Promise<Visita | null> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .select(SELECT_WITH_REL)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? flattenRels(data) : null;
  }

  async create(payload: Partial<Visita>): Promise<Visita> {
    const tecnicosIds = this.resolveIds(payload.tecnicos_ids, payload.tecnico_id);
    const tiposIds = this.resolveIds(payload.tipos_visita_ids, payload.tipo_visita_id);
    const principalPayload: Partial<Visita> = {
      ...payload,
      tecnico_id: tecnicosIds[0] ?? null,
      tipo_visita_id: tiposIds[0] ?? null,
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
    await this.syncPivote('visita_tecnicos', created.id, 'tecnico_id', tecnicosIds);
    await this.syncPivote('visita_tipos_visita', created.id, 'tipo_visita_id', tiposIds);
    return (await this.getById(created.id)) ?? created;
  }

  async update(id: string, payload: Partial<Visita>): Promise<Visita> {
    const tecnicosIds = this.resolveIds(payload.tecnicos_ids, payload.tecnico_id);
    const tiposIds = this.resolveIds(payload.tipos_visita_ids, payload.tipo_visita_id);
    const principalPayload: Partial<Visita> = {
      ...payload,
      tecnico_id: tecnicosIds[0] ?? null,
      tipo_visita_id: tiposIds[0] ?? null,
    };
    const { data, error } = await this.sb.client
      .from(this.table)
      .update(toPayload(principalPayload))
      .eq('id', id)
      .select(SELECT_WITH_REL)
      .single();
    if (error) throw error;
    await this.syncPivote('visita_tecnicos', id, 'tecnico_id', tecnicosIds);
    await this.syncPivote('visita_tipos_visita', id, 'tipo_visita_id', tiposIds);
    return (await this.getById(id)) ?? flattenRels(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }

  /** Clona una visita (la original suele quedar en 'visita_fallida'). */
  async clone(originalId: string, nuevoEstado: EstadoVisita = 'coordinado_con_cliente'): Promise<Visita> {
    const original = await this.getById(originalId);
    if (!original) throw new Error('Visita original no encontrada');
    const {
      id: _id,
      created_at: _c,
      updated_at: _u,
      tecnico: _t,
      tipo_visita: _tv,
      tecnicos,
      tipos_visita,
      ...rest
    } = original;
    const tiposIds = (tipos_visita ?? []).map((t) => t.id);
    const payload: Partial<Visita> = {
      ...rest,
      estado: nuevoEstado,
      parent_visita_id: original.id,
      tecnico_id: null,
      tecnicos_ids: [],
      tipos_visita_ids: tiposIds,
      fecha_inicio: null,
      fecha_fin: null,
    };
    return this.create(payload);
  }

  async changeStatus(id: string, estado_nuevo: EstadoVisita): Promise<Visita> {
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

  /** Sincroniza un pivote: borra todos los rows de la visita y reinsertar los ids dados. */
  private async syncPivote(
    table: 'visita_tecnicos' | 'visita_tipos_visita',
    visitaId: string,
    colName: 'tecnico_id' | 'tipo_visita_id',
    ids: string[],
  ): Promise<void> {
    const { error: delError } = await this.sb.client.from(table).delete().eq('visita_id', visitaId);
    if (delError) throw delError;
    if (!ids.length) return;
    const rows = ids.map((id) => ({ visita_id: visitaId, [colName]: id }));
    const { error: insError } = await this.sb.client.from(table).insert(rows);
    if (insError) throw insError;
  }
}
