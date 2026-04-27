import { describe, expect, it } from 'vitest';
import { baseOptions, gradientColorByRate, paletteColor, TIPO_PALETTE } from './charts.util';

describe('charts.util', () => {
  describe('baseOptions', () => {
    it('devuelve textStyle, tooltip, legend y grid', () => {
      const opts = baseOptions(false);
      expect(opts.textStyle).toBeDefined();
      expect(opts.tooltip).toBeDefined();
      expect(opts.legend).toBeDefined();
      expect(opts.grid).toBeDefined();
    });

    it('cambia el color del texto segun tema', () => {
      const light = baseOptions(false);
      const dark = baseOptions(true);
      expect(light.textStyle).not.toEqual(dark.textStyle);
    });
  });

  describe('paletteColor', () => {
    it('cicla por la paleta', () => {
      expect(paletteColor(0)).toBe(TIPO_PALETTE[0]);
      expect(paletteColor(TIPO_PALETTE.length)).toBe(TIPO_PALETTE[0]);
      expect(paletteColor(TIPO_PALETTE.length + 3)).toBe(TIPO_PALETTE[3]);
    });
  });

  describe('gradientColorByRate', () => {
    it('verde para tasas bajas', () => {
      expect(gradientColorByRate(0)).toBe('#10b981');
      expect(gradientColorByRate(15)).toBe('#10b981');
    });
    it('rojo para tasas altas', () => {
      expect(gradientColorByRate(85)).toBe('#dc2626');
      expect(gradientColorByRate(100)).toBe('#dc2626');
    });
    it('clamp a [0,100]', () => {
      expect(gradientColorByRate(-50)).toBe('#10b981');
      expect(gradientColorByRate(200)).toBe('#dc2626');
    });
  });
});
