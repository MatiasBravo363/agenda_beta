import { describe, it, expect } from 'vitest';
import { mensajeGenericoDeError } from './service-error.util';

describe('mensajeGenericoDeError', () => {
  it('reconoce error de RLS por mensaje', () => {
    const e = { message: 'new row violates row-level security policy for table' };
    expect(mensajeGenericoDeError(e)).toBe('No tienes permisos para esta acción.');
  });

  it('reconoce error de RLS por código 42501', () => {
    expect(mensajeGenericoDeError({ code: '42501', message: 'permission denied' }))
      .toBe('No tienes permisos para esta acción.');
  });

  it('reconoce duplicate key', () => {
    expect(mensajeGenericoDeError({ code: '23505' }))
      .toBe('Ya existe un registro con esos datos.');
  });

  it('reconoce foreign key violation', () => {
    expect(mensajeGenericoDeError({ code: '23503' }))
      .toBe('No se puede completar: el registro está relacionado con otros datos.');
  });

  it('reconoce not null violation', () => {
    expect(mensajeGenericoDeError({ code: '23502' }))
      .toBe('Faltan campos obligatorios.');
  });

  it('reconoce error de red', () => {
    expect(mensajeGenericoDeError({ message: 'Failed to fetch' }))
      .toBe('Problema de conexión. Intenta nuevamente.');
  });

  it('devuelve fallback custom si no matchea ningún patrón', () => {
    expect(mensajeGenericoDeError({ message: 'algo random' }, 'No se pudo guardar.'))
      .toBe('No se pudo guardar.');
  });

  it('devuelve fallback default si no se pasa', () => {
    expect(mensajeGenericoDeError({}))
      .toBe('No se pudo completar la acción.');
  });

  it('soporta error null/undefined', () => {
    expect(mensajeGenericoDeError(null)).toBe('No se pudo completar la acción.');
    expect(mensajeGenericoDeError(undefined)).toBe('No se pudo completar la acción.');
  });
});
