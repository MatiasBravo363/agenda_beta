import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const sb = inject(SupabaseService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  // Asegura que la restauración de sesión terminó antes de decidir
  await sb.client.auth.getSession();
  if (auth.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
};

export const publicGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const sb = inject(SupabaseService);
  const router = inject(Router);
  // 1.0.21: chequear el signal primero (gratis, sin HTTP). Solo si no
  // sabemos el estado, esperar restauración de sesión via getSession().
  // Antes hacíamos getSession() siempre — sumaba 1 request HTTP por
  // navegación a /login, /reset-password, /status, /sin-permisos para
  // usuarios ya logueados.
  if (auth.isAuthenticated()) {
    router.navigate(['/visitas']);
    return false;
  }
  await sb.client.auth.getSession();
  if (!auth.isAuthenticated()) return true;
  router.navigate(['/visitas']);
  return false;
};
