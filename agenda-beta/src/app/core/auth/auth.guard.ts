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
  await sb.client.auth.getSession();
  if (!auth.isAuthenticated()) return true;
  router.navigate(['/actividades']);
  return false;
};
