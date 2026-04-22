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

export const ESTADOS: EstadoActividad[] = [
  'en_cola',
  'coordinado_con_cliente',
  'agendado_con_tecnico',
  'visita_fallida',
  'completada',
];
