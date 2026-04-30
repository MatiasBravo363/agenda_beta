import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/auth/auth.guard';
import { permisoGuard } from './core/auth/permiso.guard';

/**
 * Convención de seguridad (1.0.15+):
 *
 * Cada item del sidebar (main-layout.component.ts) que use `*appSiTiene='X.ver'`
 * DEBE tener su ruta declarada acá con `canActivate: [permisoGuard('X.ver')]`
 * usando exactamente el mismo código.
 *
 * Esto evita la brecha de Broken Access Control (OWASP A01) donde un usuario
 * sin permiso podía acceder tipeando la URL aunque el menú lo ocultara.
 *
 * El test de regresión en app.routes.spec.ts garantiza que cada ruta listada
 * tenga al menos un canActivate. NO REMOVER el guard sin actualizar el test.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'status',
    loadComponent: () => import('./features/status/status.component').then((m) => m.StatusComponent),
  },
  {
    // Página pública sin sidebar para mostrar "no tenés permisos".
    // Es el destino del permisoGuard cuando rechaza acceso (evita loop de
    // redirect que ocurría redirigiendo a /visitas si /visitas también está gateado).
    path: 'sin-permisos',
    loadComponent: () => import('./features/sin-permisos/sin-permisos.component').then((m) => m.SinPermisosComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layouts/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'visitas' },

      {
        path: 'dashboard',
        canActivate: [permisoGuard('dashboard.ver')],
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },

      {
        path: 'visitas',
        canActivate: [permisoGuard('visitas.ver')],
        loadComponent: () =>
          import('./features/visitas/visitas-shell.component').then((m) => m.VisitasShellComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'lista' },
          {
            path: 'lista',
            loadComponent: () =>
              import('./features/visitas/visitas-list.component').then((m) => m.VisitasListComponent),
          },
          {
            path: 'calendario',
            loadComponent: () =>
              import('./features/visitas/visitas-calendar.component').then((m) => m.VisitasCalendarComponent),
          },
          {
            path: 'nueva',
            loadComponent: () =>
              import('./features/visitas/visita-form.component').then((m) => m.VisitaFormComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/visitas/visita-form.component').then((m) => m.VisitaFormComponent),
          },
        ],
      },

      {
        path: 'actividades',
        pathMatch: 'full',
        canActivate: [permisoGuard('actividades.ver')],
        loadComponent: () =>
          import('./features/actividades/actividades.component').then((m) => m.ActividadesComponent),
      },
      // Redirects legacy: bookmarks viejos de /actividades/* (cuando era el módulo de visitas) siguen funcionando.
      // No necesitan guard — el guard de la ruta destino se ejecuta tras el redirect.
      { path: 'actividades/lista',       redirectTo: 'visitas/lista' },
      { path: 'actividades/calendario',  redirectTo: 'visitas/calendario' },
      { path: 'actividades/nueva',       redirectTo: 'visitas/nueva' },
      { path: 'actividades/:id',         redirectTo: 'visitas/:id' },

      {
        path: 'tecnicos',
        canActivate: [permisoGuard('tecnicos.ver')],
        loadComponent: () =>
          import('./features/technicians/technicians.component').then((m) => m.TechniciansComponent),
      },
      // Redirects legacy para tipos de visita/actividad
      { path: 'tipos-actividad', pathMatch: 'full', redirectTo: 'actividades' },
      { path: 'tipos-visita',    pathMatch: 'full', redirectTo: 'actividades' },

      {
        path: 'usuarios',
        canActivate: [permisoGuard('usuarios.ver')],
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'tipos-usuario',
        canActivate: [permisoGuard('tipos_usuario.gestionar')],
        loadComponent: () => import('./features/tipos-usuario/tipos-usuario.component').then((m) => m.TiposUsuarioComponent),
      },
      {
        path: 'configuracion',
        canActivate: [permisoGuard('configuracion.ver')],
        loadComponent: () => import('./features/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
