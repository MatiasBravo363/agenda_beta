import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermisosService } from '../services/permisos.service';
import { PermisoCodigo } from '../models';

export function permisoGuard(codigo: PermisoCodigo): CanActivateFn {
  return async () => {
    const permisos = inject(PermisosService);
    const router = inject(Router);
    // Esperar a que el servicio esté cargado si aún no lo está
    if (!permisos.cargado()) {
      await new Promise((r) => setTimeout(r, 300));
    }
    if (permisos.tiene(codigo)) return true;
    router.navigate(['/actividades']);
    return false;
  };
}
