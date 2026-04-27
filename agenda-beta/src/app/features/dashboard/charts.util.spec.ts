import { describe, expect, it } from 'vitest';
import { baseOptions, chartSubtextColor, chartTextColor, gradientColorByRate, paletteColor, TIPO_PALETTE } from './charts.util';

describe('charts.util', () => {
  describe('baseOptions', () => {
    it('devuelve solo textStyle (sin grid/legend/tooltip que rompian charts cuando se mezclaban)', () => {
      const opts = baseOptions(false);
      expect(opts.textStyle).toBeDefined();
      expect(opts.grid).toBeUndefined();
      expect(opts.legend).toBeUndefined();
      expect(opts.tooltip).toBeUndefined();
    });

    it('cambia el color del texto segun tema', () => {
      expect(chartTextColor(false)).not.toEqual(chartTextColor(true));
      expect(chartSubtextColor(false)).not.toEqual(chartSubtextColor(true));
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
