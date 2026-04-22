export type EstadoActividad =
  | 'en_cola'
  | 'coordinado_con_cliente'
  | 'agendado_con_tecnico'
  | 'visita_fallida'
  | 'completada';

export type TipoTecnico = 'interno' | 'externo';

export type PermisoCodigo =
  | 'actividades.ver'
  | 'actividades.crear'
  | 'actividades.editar'
  | 'actividades.borrar'
  | 'actividades.exportar'
  | 'tecnicos.ver'
  | 'tecnicos.crear'
  | 'tecnicos.editar'
  | 'tecnicos.borrar'
  | 'tipos_actividad.ver'
  | 'tipos_actividad.crear'
  | 'tipos_actividad.editar'
  | 'tipos_actividad.borrar'
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

export interface TipoActividad {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface Actividad {
  id: string;
  numero?: number;
  cantidad_pendiente?: number;
  nombre_cliente: string;
  tipo_actividad_id: string | null;
  tecnico_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ubicacion: string | null;
  ubicacion_lat?: number | null;
  ubicacion_lng?: number | null;
  descripcion: string | null;
  estado: EstadoActividad;
  parent_activity_id: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
  tecnico?: Tecnico | null;
  tipo_actividad?: TipoActividad | null;
  creado_por?: Usuario | null;
  // Multi-asignación (pivotes actividad_tecnicos / actividad_tipos_actividad).
  // `tecnico_id` y `tipo_actividad_id` quedan como "principal" (primer elemento).
  tecnicos?: Tecnico[];
  tipos_actividad?: TipoActividad[];
  tecnicos_ids?: string[];
  tipos_actividad_ids?: string[];
}

export interface ActividadHistorial {
  id: string;
  actividad_id: string;
  estado_anterior: EstadoActividad | null;
  estado_nuevo: EstadoActividad;
  comentario: string | null;
  usuario_id: string | null;
  created_at: string;
  actividad?: Actividad | null;
  usuario?: Usuario | null;
}
