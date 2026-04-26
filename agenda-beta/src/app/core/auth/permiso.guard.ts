import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermisosService } from '../services/permisos.service';
import { PermisoCodigo } from '../models';

export function permisoGuard(codigo: PermisoCodigo): CanActivateFn {
  return async () => {
    const permisos = inject(PermisosService);
    const router = inject(Router);

    // Falla cerrada: si los permisos no se pueden cargar (timeout o error),
    // redirigir y NO dejar pasar. Mejor un falso negativo que un falso positivo.
    try {
      await permisos.waitUntilLoaded(5000);
    } catch {
      router.navigate(['/visitas']);
      return false;
    }

    if (permisos.tiene(codigo)) return true;
    router.navigate(['/visitas']);
    return false;
  };
}
