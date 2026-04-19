export type EstadoActividad =
  | 'en_cola'
  | 'coordinado_con_cliente'
  | 'agendado_con_tecnico'
  | 'visita_fallida'
  | 'completada';

export type TipoTecnico = 'interno' | 'externo';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  activo: boolean;
  created_at?: string;
  last_sign_in_at?: string | null;
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
  nombre_cliente: string;
  tipo_actividad_id: string | null;
  tecnico_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ubicacion: string | null;
  descripcion: string | null;
  estado: EstadoActividad;
  parent_activity_id: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
  tecnico?: Tecnico | null;
  tipo_actividad?: TipoActividad | null;
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
