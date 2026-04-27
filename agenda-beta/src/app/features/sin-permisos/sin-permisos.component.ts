import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PermisosService } from '../../core/services/permisos.service';

/**
 * Página pública (sin sidebar) que se muestra cuando el guard rechaza el acceso.
 * Existe para evitar el loop de redirect: antes el guard redirigía a /visitas,
 * pero /visitas ahora también está gateado, y un usuario sin visitas.ver
 * caía en loop infinito (visitas → guard rechaza → visitas → guard rechaza...).
 */
@Component({
  selector: 'app-sin-permisos',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div class="card p-8 max-w-md w-full text-center space-y-4">
        <div class="text-6xl">🔒</div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Sin permisos
        </h1>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Tu usuario no tiene permisos para acceder a esta sección. Si creés que es un error, contactá al administrador.
        </p>
        <div class="flex flex-col gap-2 pt-2">
          <button class="btn-primary w-full" (click)="volverAlInicio()">
            Volver al inicio
          </button>
          <button class="btn-secondary w-full" (click)="cerrarSesion()">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SinPermisosComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private permisos = inject(PermisosService);

  /**
   * Volver al inicio: si tiene visitas.ver, va a /visitas; si tiene
   * dashboard.ver, va a /dashboard; si no tiene ninguno, signOut.
   */
  async volverAlInicio() {
    if (this.permisos.tiene('visitas.ver')) {
      this.router.navigate(['/visitas']);
    } else if (this.permisos.tiene('dashboard.ver')) {
      this.router.navigate(['/dashboard']);
    } else {
      await this.cerrarSesion();
    }
  }

  async cerrarSesion() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
