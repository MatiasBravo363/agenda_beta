import { EstadoVisita, Tecnico, Visita } from '../models';

export const ESTADO_LABEL: Record<EstadoVisita, string> = {
  en_cola: 'En cola',
  coordinado_con_cliente: 'Coordinado con cliente',
  agendado_con_tecnico: 'Agendado con técnico',
  visita_fallida: 'Visita fallida',
  completada: 'Completada',
};

/**
 * Color derivado de la regla de negocio Bermann (simplificado: el hue depende
 * sólo del estado; el técnico se recibe por compatibilidad de firma).
 */
export function colorDeVisita(v: Pick<Visita, 'estado'>, _t?: Tecnico | null): string {
  return colorDeEstado(v.estado);
}

/**
 * Color base por estado, sin depender del técnico. Útil para dashboards,
 * leyendas y spotlight cards donde no hay una visita concreta.
 */
export function colorDeEstado(estado: EstadoVisita): string {
  // Paleta mid-tone (texto blanco legible). Suavizada respecto a los tonos
  // intensos anteriores, manteniendo el hue de cada estado.
  switch (estado) {
    case 'en_cola': return '#94a3b8';               // slate-400
    case 'coordinado_con_cliente': return '#ef4444'; // red-500
    case 'agendado_con_tecnico': return '#38bdf8';   // sky-400
    case 'visita_fallida': return '#a16207';         // amber-700 (marrón cálido)
    case 'completada': return '#22c55e';             // green-500
  }
}

export const ESTADOS: EstadoVisita[] = [
  'en_cola',
  'coordinado_con_cliente',
  'agendado_con_tecnico',
  'visita_fallida',
  'completada',
];

/**
 * Estados que requieren al menos un técnico asignado a la visita.
 * Validación bidireccional: el form bloquea guardar si (a) hay técnicos pero
 * el estado no está acá, o (b) el estado está acá pero no hay técnicos.
 */
export const ESTADOS_REQUIEREN_TECNICO: EstadoVisita[] = [
  'agendado_con_tecnico',
  'visita_fallida',
  'completada',
];
