import { Actividad, EstadoActividad, Tecnico } from '../models';

export const ESTADO_LABEL: Record<EstadoActividad, string> = {
  en_cola: 'En cola',
  coordinado_con_cliente: 'Coordinado con cliente',
  agendado_con_tecnico: 'Agendado con técnico',
  visita_fallida: 'Visita fallida',
  completada: 'Completada',
};

/**
 * Color derivado de la regla de negocio Bermann:
 * - en_cola → azul
 * - coordinado_con_cliente → rojo
 * - agendado_con_tecnico + técnico NO Bermann → naranjo (técnico externo/regional)
 * - agendado_con_tecnico + externo en Santiago → verde (opcional)
 * - visita_fallida → gris
 * - completada → verde oscuro
 */
export function colorDeActividad(a: Pick<Actividad, 'estado'>, _t?: Tecnico | null): string {
  return colorDeEstado(a.estado);
}

/**
 * Color base por estado, sin depender del técnico. Útil para dashboards,
 * leyendas y spotlight cards donde no hay una actividad concreta.
 */
export function colorDeEstado(estado: EstadoActividad): string {
  switch (estado) {
    case 'en_cola': return '#64748b';
    case 'coordinado_con_cliente': return '#dc2626';
    case 'agendado_con_tecnico': return '#0ea5e9';
    case 'visita_fallida': return '#8b4513';
    case 'completada': return '#5ccb5f';
  }
}

export const ESTADOS: EstadoActividad[] = [
  'en_cola',
  'coordinado_con_cliente',
  'agendado_con_tecnico',
  'visita_fallida',
  'completada',
];
