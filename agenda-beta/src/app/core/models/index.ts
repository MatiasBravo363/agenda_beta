export type EstadoVisita =
  | 'en_cola'
  | 'coordinado_con_cliente'
  | 'agendado_con_tecnico'
  | 'visita_fallida'
  | 'completada';

export type TipoTecnico = 'interno' | 'externo';

export type PermisoCodigo =
  | 'visitas.ver'
  | 'visitas.crear'
  | 'visitas.editar'
  | 'visitas.borrar'
  | 'visitas.exportar'
  | 'tecnicos.ver'
  | 'tecnicos.crear'
  | 'tecnicos.editar'
  | 'tecnicos.borrar'
  | 'actividades.ver'
  | 'actividades.crear'
  | 'actividades.editar'
  | 'actividades.borrar'
  | 'usuarios.ver'
  | 'usuarios.invitar'
  | 'usuarios.editar'
  | 'usuarios.borrar'
  | 'historial.ver'
  | 'dashboard.ver'
  | 'configuracion.ver'
  | 'log.ver'
  | 'tipos_usuario.gestionar';

export interface TipoUsuario {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at?: string;
  permisos_count?: number;
  usuarios_count?: number;
}

export interface Permiso {
  id: string;
  codigo: PermisoCodigo;
  descripcion: string;
  categoria: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  activo: boolean;
  created_at?: string;
  last_sign_in_at?: string | null;
  tipo_usuario_id?: string | null;
  tipo_usuario?: TipoUsuario | null;
}

export interface Tecnico {
  id: string;
  nombre: string;
  apellidos: string;
  rut: string;
  tipo: TipoTecnico;
  tecnico_bermann: boolean;
  region: string | null;
  activo: boolean;
  created_at?: string;
}

export interface Actividad {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface Visita {
  id: string;
  numero?: number;
  cantidad_pendiente?: number;
  nombre_cliente: string;
  actividad_id: string | null;
  tecnico_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ubicacion: string | null;
  ubicacion_lat?: number | null;
  ubicacion_lng?: number | null;
  descripcion: string | null;
  estado: EstadoVisita;
  parent_visita_id: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
  tecnico?: Tecnico | null;
  actividad?: Actividad | null;
  creado_por?: Usuario | null;
  // Multi-asignación (pivotes visita_tecnicos / visita_actividades).
  // `tecnico_id` y `actividad_id` quedan como "principal" (primer elemento).
  tecnicos?: Tecnico[];
  actividades?: Actividad[];
  tecnicos_ids?: string[];
  actividades_ids?: string[];
}

export interface VisitaHistorial {
  id: string;
  visita_id: string;
  estado_anterior: EstadoVisita | null;
  estado_nuevo: EstadoVisita;
  comentario: string | null;
  usuario_id: string | null;
  created_at: string;
  visita?: Visita | null;
  usuario?: Usuario | null;
}
