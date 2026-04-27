import { describe, it, expect } from 'vitest';
import { agruparPorDia, diaKey, labelDia } from './visitas-grupos.util';
import { Visita } from '../../core/models';

function v(id: string, fecha: string | null): Visita {
  return {
    id,
    nombre_cliente: 'X',
    actividad_id: null,
    tecnico_id: null,
    fecha_inicio: fecha,
    fecha_fin: null,
    ubicacion: null,
    descripcion: null,
    estado: 'en_cola',
    parent_visita_id: null,
    created_by: null,
  } as Visita;
}

describe('visitas-grupos.util', () => {
  it('diaKey devuelve YYYY-MM-DD para una fecha válida', () => {
    expect(diaKey('2026-04-15T10:30:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('diaKey devuelve null si no hay fecha', () => {
    expect(diaKey(null)).toBeNull();
    expect(diaKey(undefined)).toBeNull();
    expect(diaKey('')).toBeNull();
  });

  it('labelDia produce un label legible en castellano', () => {
    const label = labelDia('2026-04-15');
    expect(label).toContain('de Abril');
    expect(label).toContain('2026');
  });

  it('agruparPorDia agrupa por día y ordena cronológicamente', () => {
    const visitas = [
      v('a', '2026-04-15T10:00:00'),
      v('b', '2026-04-14T10:00:00'),
      v('c', '2026-04-15T16:00:00'),
    ];
    const grupos = agruparPorDia(visitas);
    expect(grupos.map((g) => g.key)).toEqual(['2026-04-14', '2026-04-15']);
    expect(grupos[1].items.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('agruparPorDia mete las sin-fecha al final con clave __sin__', () => {
    const visitas = [
      v('a', '2026-04-15T10:00:00'),
      v('b', null),
      v('c', '2026-04-14T10:00:00'),
    ];
    const grupos = agruparPorDia(visitas);
    expect(grupos[grupos.length - 1].key).toBe('__sin__');
    expect(grupos[grupos.length - 1].label).toBe('Sin fecha');
    expect(grupos[grupos.length - 1].items[0].id).toBe('b');
  });

  it('agruparPorDia con array vacío devuelve []', () => {
    expect(agruparPorDia([])).toEqual([]);
  });
});
