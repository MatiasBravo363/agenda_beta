import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/auth/auth.guard';
import { permisoGuard } from './core/auth/permiso.guard';

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
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layouts/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'visitas' },

      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },

      {
        path: 'visitas',
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
        loadComponent: () =>
          import('./features/actividades/actividades.component').then((m) => m.ActividadesComponent),
      },
      // Redirects legacy: bookmarks viejos de /actividades/* (cuando era el módulo de visitas) siguen funcionando.
      { path: 'actividades/lista',       redirectTo: 'visitas/lista' },
      { path: 'actividades/calendario',  redirectTo: 'visitas/calendario' },
      { path: 'actividades/nueva',       redirectTo: 'visitas/nueva' },
      { path: 'actividades/:id',         redirectTo: 'visitas/:id' },

      {
        path: 'tecnicos',
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
        path: 'historial',
        loadComponent: () => import('./features/history/history.component').then((m) => m.HistoryComponent),
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./features/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
