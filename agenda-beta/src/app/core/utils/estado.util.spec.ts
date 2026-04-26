import { describe, it, expect } from 'vitest';
import { ESTADOS, ESTADO_LABEL, colorDeEstado, colorDeVisita } from './estado.util';
import { EstadoVisita } from '../models';

describe('estado.util', () => {
  it('exporta los 5 estados de visita', () => {
    expect(ESTADOS).toEqual([
      'en_cola',
      'coordinado_con_cliente',
      'agendado_con_tecnico',
      'visita_fallida',
      'completada',
    ]);
  });

  it('tiene un label legible para cada estado', () => {
    for (const e of ESTADOS) {
      expect(ESTADO_LABEL[e]).toBeTruthy();
      expect(typeof ESTADO_LABEL[e]).toBe('string');
    }
  });

  it('colorDeEstado devuelve un color hex distinto por cada estado', () => {
    const colors = ESTADOS.map((e) => colorDeEstado(e));
    expect(new Set(colors).size).toBe(ESTADOS.length);
    for (const c of colors) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('colorDeVisita derivá del estado de la visita', () => {
    for (const e of ESTADOS) {
      expect(colorDeVisita({ estado: e })).toBe(colorDeEstado(e));
    }
  });

  it('colorDeVisita ignora el técnico (regla de negocio actual)', () => {
    const v: { estado: EstadoVisita } = { estado: 'completada' };
    const tecnico = { id: 'x', nombre: 'X', apellidos: 'X', rut: '0', tipo: 'interno', tecnico_bermann: true } as any;
    expect(colorDeVisita(v, tecnico)).toBe(colorDeVisita(v, null));
  });
});
