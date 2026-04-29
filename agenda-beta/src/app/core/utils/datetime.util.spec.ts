import { describe, expect, it } from 'vitest';
import { datetimeLocalToISO, isoToDatetimeLocal } from './datetime.util';

describe('datetime.util', () => {
  describe('isoToDatetimeLocal', () => {
    it('devuelve string vacio para null/undefined/empty', () => {
      expect(isoToDatetimeLocal(null)).toBe('');
      expect(isoToDatetimeLocal(undefined)).toBe('');
      expect(isoToDatetimeLocal('')).toBe('');
    });

    it('devuelve string vacio para input invalido', () => {
      expect(isoToDatetimeLocal('not-a-date')).toBe('');
    });

    it('devuelve formato YYYY-MM-DDTHH:MM', () => {
      // Usar fecha actual local para que el test funcione independiente del TZ del CI
      const now = new Date(2026, 3, 29, 12, 30); // local: 29-abr-2026 12:30
      const iso = now.toISOString();
      expect(isoToDatetimeLocal(iso)).toBe('2026-04-29T12:30');
    });
  });

  describe('datetimeLocalToISO', () => {
    it('devuelve null para empty/null', () => {
      expect(datetimeLocalToISO(null)).toBeNull();
      expect(datetimeLocalToISO('')).toBeNull();
    });

    it('parsea YYYY-MM-DDTHH:MM como hora local', () => {
      const iso = datetimeLocalToISO('2026-04-29T12:30');
      // Convertir el ISO de vuelta a local y verificar componentes
      const d = new Date(iso!);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(3); // 0-indexed: abril
      expect(d.getDate()).toBe(29);
      expect(d.getHours()).toBe(12);
      expect(d.getMinutes()).toBe(30);
    });

    it('soporta segundos opcionales', () => {
      const iso = datetimeLocalToISO('2026-04-29T12:30:45');
      const d = new Date(iso!);
      expect(d.getSeconds()).toBe(45);
    });

    it('roundtrip ISO → local → ISO preserva minutos', () => {
      const original = new Date(2026, 5, 15, 8, 45).toISOString();
      const roundtrip = datetimeLocalToISO(isoToDatetimeLocal(original));
      // A precisión de minutos (los segundos/ms se pierden en el input)
      expect(roundtrip!.slice(0, 16)).toBe(original.slice(0, 16));
    });
  });
});
