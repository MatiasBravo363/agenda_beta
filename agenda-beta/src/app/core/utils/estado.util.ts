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
export function colorDeActividad(a: Pick<Actividad, 'estado'>, t?: Tecnico | null): string {
  switch (a.estado) {
    case 'en_cola':
      return '#2563eb';
    case 'coordinado_con_cliente':
      return '#dc2626';
    case 'agendado_con_tecnico':
      if (t && !t.tecnico_bermann && (t.region ?? '').toLowerCase() === 'santiago') {
        return '#16a34a';
      }
      return '#ea580c';
    case 'visita_fallida':
      return '#6b7280';
    case 'completada':
      return '#065f46';
  }
}

export const ESTADOS: EstadoActividad[] = [
  'en_cola',
  'coordinado_con_cliente',
  'agendado_con_tecnico',
  'visita_fallida',
  'completada',
];
