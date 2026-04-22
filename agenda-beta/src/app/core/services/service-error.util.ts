import { environment } from '../../../environments/environment';

/**
 * Devuelve un mensaje seguro para mostrar al usuario sobre errores de
 * servicios (Supabase PostgREST). Evita filtrar detalles de policies RLS,
 * nombres de columnas o constraints internos.
 * En dev se deja el error crudo en consola para debug.
 */
export function mensajeGenericoDeError(e: any, fallback = 'No se pudo completar la acción.'): string {
  if (!environment.production) {
    // eslint-disable-next-line no-console
    console.error('[service]', e);
  }
  const msg = String(e?.message ?? '').toLowerCase();
  const code = String(e?.code ?? '');
  if (msg.includes('row-level security') || code === '42501') {
    return 'No tienes permisos para esta acción.';
  }
  if (msg.includes('duplicate key') || code === '23505') {
    return 'Ya existe un registro con esos datos.';
  }
  if (msg.includes('violates foreign key') || code === '23503') {
    return 'No se puede completar: el registro está relacionado con otros datos.';
  }
  if (msg.includes('not null violation') || code === '23502') {
    return 'Faltan campos obligatorios.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Problema de conexión. Intenta nuevamente.';
  }
  return fallback;
}
