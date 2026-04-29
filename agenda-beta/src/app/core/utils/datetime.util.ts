/**
 * Helpers para convertir entre ISO strings (UTC, lo que persistimos en DB)
 * y la representación que usa el input HTML <input type="datetime-local">
 * ('YYYY-MM-DDTHH:MM' en zona horaria del browser).
 *
 * Importante: NO usar `new Date(v)` con strings sin TZ — el comportamiento
 * varía entre browsers (Safari viejos lo parsean como UTC, Chrome moderno
 * como local). Acá parseamos con componentes numéricos via
 * `new Date(year, month-1, day, hour, minute)` que es siempre local
 * cross-browser.
 */

/**
 * Convierte un ISO string a la representación que usa <input type="datetime-local">,
 * en la zona horaria local del browser.
 *
 * Ejemplo: '2026-04-29T15:00:00.000Z' → '2026-04-29T12:00' (si TZ=UTC-3).
 */
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Convierte el valor de <input type="datetime-local"> ('YYYY-MM-DDTHH:MM') a ISO UTC.
 * Parsea componentes numéricos para garantizar interpretación local cross-browser.
 *
 * Si el input está vacío devuelve null.
 * Si el formato no matchea (ej. el browser devuelve algo raro), cae al
 * `new Date(v).toISOString()` como fallback.
 */
export function datetimeLocalToISO(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) {
    const fallback = new Date(v);
    if (isNaN(fallback.getTime())) return null;
    return fallback.toISOString();
  }
  const [, y, mo, d, h, mi, s] = m;
  return new Date(+y, +mo - 1, +d, +h, +mi, s ? +s : 0).toISOString();
}
