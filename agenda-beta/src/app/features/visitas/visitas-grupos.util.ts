import { Visita } from '../../core/models';

export interface GrupoDia {
  key: string;
  label: string;
  items: Visita[];
}

const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function diaKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function labelDia(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS_LARGOS[date.getDay()]} ${d} de ${MESES[m - 1]} de ${y}`;
}

/**
 * Agrupa una lista de visitas por día (clave 'YYYY-MM-DD' o '__sin__'
 * para las que no tienen fecha). Días ordenados **descendente** (más reciente
 * primero), '__sin__' siempre al final.
 *
 * Función pura, testeable sin Angular.
 */
export function agruparPorDia(visitas: readonly Visita[]): GrupoDia[] {
  const map = new Map<string, Visita[]>();
  for (const v of visitas) {
    const k = diaKey(v.fecha_inicio) ?? '__sin__';
    const arr = map.get(k) ?? [];
    arr.push(v);
    map.set(k, arr);
  }
  // Orden descendente por key (YYYY-MM-DD ordena lexicográficamente igual que cronológicamente).
  const keys = Array.from(map.keys()).sort((a, b) => {
    if (a === '__sin__') return 1;
    if (b === '__sin__') return -1;
    return a < b ? 1 : a > b ? -1 : 0;
  });
  return keys.map((k) => ({
    key: k,
    label: k === '__sin__' ? 'Sin fecha' : labelDia(k),
    items: map.get(k)!,
  }));
}
