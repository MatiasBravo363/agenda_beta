import { environment } from '../../../environments/environment';

/**
 * Mapea errores de Supabase Auth a mensajes genéricos para no filtrar
 * información (enumeración de usuarios, detalles de policies, etc.).
 * En dev se deja el error crudo en consola para debug.
 */
export function mensajeAuthGenerico(e: unknown): string {
  if (!environment.production) {
    // eslint-disable-next-line no-console
    console.error('[auth]', e);
  }
  const msg = String((e as { message?: string })?.message ?? '').toLowerCase();
  if (!msg) return 'Hubo un problema, intenta más tarde.';
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return 'Credenciales inválidas.';
  }
  if (msg.includes('email not confirmed')) {
    return 'La cuenta no está activada. Pide al administrador que reenvíe la invitación.';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Demasiados intentos. Espera unos minutos antes de volver a intentar.';
  }
  if (msg.includes('password') && msg.includes('should')) {
    return 'La contraseña no cumple con los requisitos mínimos.';
  }
  if (msg.includes('token') && (msg.includes('expired') || msg.includes('invalid'))) {
    return 'El enlace expiró o no es válido. Solicita uno nuevo.';
  }
  if (msg.includes('network')) {
    return 'Problema de conexión. Verifica tu red e intenta nuevamente.';
  }
  return 'No se pudo completar la acción. Intenta más tarde.';
}
