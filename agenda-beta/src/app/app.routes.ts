import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
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
      { path: '', pathMatch: 'full', redirectTo: 'actividades' },

      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },

      {
        path: 'actividades',
        loadComponent: () =>
          import('./features/activities/activities-shell.component').then((m) => m.ActivitiesShellComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'lista' },
          {
            path: 'lista',
            loadComponent: () =>
              import('./features/activities/activities-list.component').then((m) => m.ActivitiesListComponent),
          },
          {
            path: 'calendario',
            loadComponent: () =>
              import('./features/activities/activities-calendar.component').then((m) => m.ActivitiesCalendarComponent),
          },
          {
            path: 'nueva',
            loadComponent: () =>
              import('./features/activities/activity-form.component').then((m) => m.ActivityFormComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/activities/activity-form.component').then((m) => m.ActivityFormComponent),
          },
        ],
      },

      {
        path: 'tecnicos',
        loadComponent: () =>
          import('./features/technicians/technicians.component').then((m) => m.TechniciansComponent),
      },
      {
        path: 'tipos-actividad',
        loadComponent: () =>
          import('./features/activity-types/activity-types.component').then((m) => m.ActivityTypesComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
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
