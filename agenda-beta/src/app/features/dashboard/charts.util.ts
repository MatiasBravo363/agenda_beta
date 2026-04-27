import type { EChartsOption } from 'echarts';

export const TIPO_PALETTE = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981',
  '#a855f7', '#ec4899', '#14b8a6',
];

/**
 * Devuelve solo `textStyle` global. Los charts NO deben hacer spread
 * de un objeto con `grid`/`legend`/`tooltip` porque echarts trata mal
 * las properties cuando se mezclan vía object spread (los pies/funnel
 * heredan grid de bar/line y las barras horizontales pierden series).
 *
 * Mejor que cada chart defina su tooltip/legend/grid de forma explícita
 * usando los color helpers de abajo.
 */
export function baseOptions(themeDark: boolean): EChartsOption {
  return { textStyle: { color: chartTextColor(themeDark) } };
}

export function chartTextColor(themeDark: boolean): string {
  return themeDark ? '#e2e8f0' : '#334155';
}

export function chartSubtextColor(themeDark: boolean): string {
  return themeDark ? '#94a3b8' : '#64748b';
}

export function chartTooltipBg(themeDark: boolean): string {
  return themeDark ? '#1e293b' : '#ffffff';
}

export function chartTooltipBorder(themeDark: boolean): string {
  return themeDark ? '#334155' : '#e2e8f0';
}

/**
 * Color por índice cíclico sobre TIPO_PALETTE — útil para series dinámicas
 * (ej. una línea por actividad descubierta en runtime).
 */
export function paletteColor(index: number): string {
  return TIPO_PALETTE[index % TIPO_PALETTE.length];
}

/**
 * Convierte una tasa (0-100) a color en gradiente verde→amarillo→rojo.
 * Útil para mostrar tasas de fallo/error donde alta = malo.
 */
export function gradientColorByRate(rate: number): string {
  const r = Math.max(0, Math.min(100, rate));
  if (r < 20) return '#10b981'; // verde
  if (r < 40) return '#84cc16'; // lima
  if (r < 60) return '#f59e0b'; // ámbar
  if (r < 80) return '#f97316'; // naranja
  return '#dc2626';             // rojo
}
