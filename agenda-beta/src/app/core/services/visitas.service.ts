import { Injectable, inject } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { SupabaseService } from '../supabase/supabase.service';
import { Actividad, EstadoVisita, Tecnico, Visita } from '../models';

const SELECT_WITH_REL =
  '*,' +
  ' tecnico:tecnicos!visitas_tecnico_id_fkey(*),' +
  ' actividad:actividades!visitas_actividad_id_fkey(*),' +
  ' creado_por:usuarios!created_by(*),' +
  ' tecnicos_rel:visita_tecnicos(tecnico:tecnicos(*)),' +
  ' actividades_rel:visita_actividades(actividad:actividades(*))';

const UPDATABLE_FIELDS: (keyof Visita)[] = [
  'nombre_cliente',
  'actividad_id',
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
  // updated_at se incluye solo en update() para optimistic locking
  // (el trigger BEFORE UPDATE lo compara contra DB y rechaza si difiere).
  'updated_at',
];

/**
 * Error tirado cuando la DB rechaza un UPDATE de visita por optimistic
 * locking (la fila fue modificada por otro usuario después de que esta
 * sesión la cargó). Código Postgres: 40001 (serialization_failure).
 */
export class ConflictoVisitaError extends Error {
  constructor(message = 'Otro usuario modificó esta visita mientras la editabas. Recargá los datos para no pisar sus cambios.') {
    super(message);
    this.name = 'ConflictoVisitaError';
  }
}

function isOptimisticLockError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const code = (e as { code?: string }).code;
  return code === '40001';
}

function toPayload(src: Partial<Visita>): Partial<Visita> {
  const out: Partial<Visita> = {};
  for (const k of UPDATABLE_FIELDS) {
    if (k in src) {
      // El cast es seguro porque k está garantizado en UPDATABLE_FIELDS ⊂ keyof Visita
      (out[k] as Visita[typeof k]) = src[k] as Visita[typeof k];
    }
  }
  return out;
}

type RawPivote<TKey extends string, TVal> = { [K in TKey]: TVal };
type RawVisita = Partial<Visita> & {
  tecnicos_rel?: RawPivote<'tecnico', Tecnico | null>[];
  actividades_rel?: RawPivote<'actividad', Actividad | null>[];
};

// Supabase tipa el resultado de .select(string) como GenericStringError | T[],
// no como T[] directo. Para evitar acoplarnos a esos tipos internos, recibimos
// `unknown` y hacemos narrowing dentro de la función.
function flattenRels(row: unknown): Visita {
  if (!row || typeof row !== 'object') return row as unknown as Visita;
  const r = row as RawVisita;
  const tecnicos: Tecnico[] = Array.isArray(r.tecnicos_rel)
    ? r.tecnicos_rel.map((p) => p.tecnico).filter((t): t is Tecnico => !!t)
    : [];
  const actividades: Actividad[] = Array.isArray(r.actividades_rel)
    ? r.actividades_rel.map((p) => p.actividad).filter((a): a is Actividad => !!a)
    : [];
  const { tecnicos_rel: _tr, actividades_rel: _ar, ...rest } = r;
  return { ...rest, tecnicos, actividades } as Visita;
}

/**
 * Si recibe una fecha sin hora ('YYYY-MM-DD') la expande a inicio de día
 * ('YYYY-MM-DD 00:00:00'). Si ya viene con hora (T en el medio), la deja como está.
 * Postgres interpreta 'YYYY-MM-DD' como medianoche, así que para `gte` ya
 * funciona, pero esto deja explícito el contrato.
 */
function expandirInicioDia(fecha: string): string {
  if (fecha.includes('T') || fecha.includes(' ')) return fecha;
  return `${fecha} 00:00:00`;
}

/**
 * Si recibe una fecha sin hora ('YYYY-MM-DD') la expande a fin de día
 * ('YYYY-MM-DD 23:59:59.999') para que `lte('fecha_inicio', hasta)` incluya
 * los registros del día completo. Sin esto, hasta=2026-04-26 excluye todo
 * lo posterior a 2026-04-26 00:00:00.
 */
function expandirFinDia(fecha: string): string {
  if (fecha.includes('T') || fecha.includes(' ')) return fecha;
  return `${fecha} 23:59:59.999`;
}

export interface VisitasListOpts {
  limit?: number;
  offset?: number;
  estado?: EstadoVisita | '';
  tecnicoId?: string | '__sin__' | '';
  cliente?: string;
  desde?: string;
  hasta?: string;
}

export interface VisitasListResult {
  items: Visita[];
  total: number | null;
}

const DEFAULT_LIST_LIMIT = 500;

@Injectable({ providedIn: 'root' })
export class VisitasService {
  private sb = inject(SupabaseService);
  private readonly table = 'visitas';

  /**
   * Sin args: trae hasta DEFAULT_LIST_LIMIT (cap defensivo, antes traía
   * dataset completo y reventaba con >5k visitas). Para listas paginables
   * usar `listPaged()` que devuelve también el total y soporta filtros
   * server-side.
   */
  async list(): Promise<Visita[]> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .select(SELECT_WITH_REL)
      .order('fecha_inicio', { ascending: true, nullsFirst: false })
      .limit(DEFAULT_LIST_LIMIT);
    if (error) throw error;
    return (data ?? []).map(flattenRels);
  }

  /**
   * Versión paginada con filtros server-side. `total` devuelve el conteo
   * estimado post-filtro (basado en pg_class.reltuples — sin scan).
   *
   * 1.0.20: cambiado de `count: 'exact'` a `count: 'estimated'` para reducir
   * carga DB (count exact era el principal hotspot de CPU según el informe
   * de performance — escaneaba la tabla filtrada en cada llamada). El total
   * mostrado en el footer puede estar ±5%, aceptable para UX.
   */
  async listPaged(opts: VisitasListOpts = {}): Promise<VisitasListResult> {
    const limit = opts.limit ?? DEFAULT_LIST_LIMIT;
    const offset = opts.offset ?? 0;

    let q = this.sb.client
      .from(this.table)
      .select(SELECT_WITH_REL, { count: 'estimated' })
      .order('fecha_inicio', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (opts.estado) q = q.eq('estado', opts.estado);
    if (opts.cliente) q = q.eq('nombre_cliente', opts.cliente);
    if (opts.tecnicoId === '__sin__') {
      q = q.is('tecnico_id', null);
    } else if (opts.tecnicoId) {
      q = q.eq('tecnico_id', opts.tecnicoId);
    }
    if (opts.desde) q = q.gte('fecha_inicio', expandirInicioDia(opts.desde));
    if (opts.hasta) q = q.lte('fecha_inicio', expandirFinDia(opts.hasta));

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      items: (data ?? []).map(flattenRels),
      total: count ?? null,
    };
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
    const actividadesIds = this.resolveIds(payload.actividades_ids, payload.actividad_id);
    const principalPayload: Partial<Visita> = {
      ...payload,
      tecnico_id: tecnicosIds[0] ?? null,
      actividad_id: actividadesIds[0] ?? null,
    };
    const { data: userData } = await this.sb.client.auth.getUser();
    const body = { ...toPayload(principalPayload), created_by: userData.user?.id ?? null };
    const { data, error } = await this.sb.client
      .from(this.table)
      .insert(body)
      .select(SELECT_WITH_REL)
      .single();
    if (error) throw error;
    const created = flattenRels(data);
    await this.syncPivote('visita_tecnicos', created.id, 'tecnico_id', tecnicosIds);
    await this.syncPivote('visita_actividades', created.id, 'actividad_id', actividadesIds);
    Sentry.addBreadcrumb({
      category: 'visita',
      message: 'visita_creada',
      level: 'info',
      data: { id: created.id, estado: created.estado, numero: created.numero },
    });
    return (await this.getById(created.id)) ?? created;
  }

  async update(id: string, payload: Partial<Visita>): Promise<Visita> {
    const tecnicosIds = this.resolveIds(payload.tecnicos_ids, payload.tecnico_id);
    const actividadesIds = this.resolveIds(payload.actividades_ids, payload.actividad_id);
    const principalPayload: Partial<Visita> = {
      ...payload,
      tecnico_id: tecnicosIds[0] ?? null,
      actividad_id: actividadesIds[0] ?? null,
    };
    const { data, error } = await this.sb.client
      .from(this.table)
      .update(toPayload(principalPayload))
      .eq('id', id)
      .select(SELECT_WITH_REL)
      .single();
    if (error) {
      if (isOptimisticLockError(error)) throw new ConflictoVisitaError();
      throw error;
    }
    await this.syncPivote('visita_tecnicos', id, 'tecnico_id', tecnicosIds);
    await this.syncPivote('visita_actividades', id, 'actividad_id', actividadesIds);
    const updated = flattenRels(data);
    Sentry.addBreadcrumb({
      category: 'visita',
      message: 'visita_actualizada',
      level: 'info',
      data: { id, estado: updated.estado, numero: updated.numero },
    });
    return (await this.getById(id)) ?? updated;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Clona una visita conservando todos los datos originales (cliente, estado,
   * ubicación, descripción, técnicos, actividades). Las fechas son provistas
   * por el modal de clonado. Si el original está en `en_cola`, las fechas
   * llegan como null y el clon queda también en cola sin horario.
   */
  async clone(
    originalId: string,
    fechaInicio: string | null,
    fechaFin: string | null,
  ): Promise<Visita> {
    const original = await this.getById(originalId);
    if (!original) throw new Error('Visita original no encontrada');
    const tecnicosIds = (original.tecnicos ?? []).map((t) => t.id);
    const actividadesIds = (original.actividades ?? []).map((a) => a.id);
    const payload: Partial<Visita> = {
      nombre_cliente: original.nombre_cliente,
      estado: original.estado,
      ubicacion: original.ubicacion,
      ubicacion_lat: original.ubicacion_lat,
      ubicacion_lng: original.ubicacion_lng,
      descripcion: original.descripcion,
      parent_visita_id: original.id,
      tecnicos_ids: tecnicosIds,
      actividades_ids: actividadesIds,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      cantidad_pendiente: 1,
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
    table: 'visita_tecnicos' | 'visita_actividades',
    visitaId: string,
    colName: 'tecnico_id' | 'actividad_id',
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
