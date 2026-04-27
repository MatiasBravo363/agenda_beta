import type { EChartsOption } from 'echarts';

export const TIPO_PALETTE = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981',
  '#a855f7', '#ec4899', '#14b8a6',
];

/**
 * Devuelve overrides comunes para todos los charts del dashboard
 * (tooltip, grid, textStyle). Los charts hacen `{ ...baseOptions(dark), ...specifics }`
 * para mantener una apariencia consistente y dark-mode aware.
 */
export function baseOptions(themeDark: boolean): EChartsOption {
  const text = themeDark ? '#e2e8f0' : '#334155';
  const subtext = themeDark ? '#94a3b8' : '#64748b';
  const tooltipBg = themeDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = themeDark ? '#334155' : '#e2e8f0';
  return {
    textStyle: { color: text },
    tooltip: {
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: text },
    },
    legend: { textStyle: { color: subtext } },
    grid: { left: 40, right: 20, top: 30, bottom: 50, containLabel: true },
  };
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
