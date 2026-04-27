import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermisosService } from '../services/permisos.service';
import { PermisoCodigo } from '../models';

export function permisoGuard(codigo: PermisoCodigo): CanActivateFn {
  return async () => {
    const permisos = inject(PermisosService);
    const router = inject(Router);

    // Falla cerrada: si los permisos no se pueden cargar (timeout o error),
    // redirigir a /sin-permisos y NO dejar pasar. Mejor un falso negativo
    // que un falso positivo.
    //
    // Ojo: NO redirigir a /visitas como antes — /visitas también está gateado
    // ahora, así que un usuario sin visitas.ver caía en loop infinito.
    // /sin-permisos es una página pública (sin guard) que muestra el mensaje
    // y ofrece volver al inicio o cerrar sesión.
    try {
      await permisos.waitUntilLoaded(5000);
    } catch {
      router.navigate(['/sin-permisos']);
      return false;
    }

    if (permisos.tiene(codigo)) return true;
    router.navigate(['/sin-permisos']);
    return false;
  };
}
