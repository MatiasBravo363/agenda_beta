import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-slate-50">
      <aside class="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div class="p-6 border-b border-slate-200">
          <div class="text-xl font-extrabold tracking-tight">Agenda<span class="text-brand-600">_BETA</span></div>
          <div class="text-xs text-slate-500 mt-1">Bermann S.A.</div>
        </div>
        <nav class="flex-1 p-4 space-y-1 text-sm">
          <a routerLink="/actividades" routerLinkActive="bg-brand-50 text-brand-700" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <span>📅</span> Actividades
          </a>
          <a routerLink="/historial" routerLinkActive="bg-brand-50 text-brand-700" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <span>🕑</span> Historial
          </a>

          <div class="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-slate-400">Mantenedores</div>
          <a routerLink="/tecnicos" routerLinkActive="bg-brand-50 text-brand-700" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <span>🔧</span> Técnicos
          </a>
          <a routerLink="/tipos-actividad" routerLinkActive="bg-brand-50 text-brand-700" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <span>🏷️</span> Tipos de actividad
          </a>
          <a routerLink="/usuarios" routerLinkActive="bg-brand-50 text-brand-700" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
            <span>👤</span> Usuarios
          </a>
        </nav>

        <div class="p-4 border-t border-slate-200 text-xs text-slate-500">
          <div class="truncate">{{ auth.user()?.email }}</div>
          <button class="btn-secondary mt-3 w-full" (click)="logout()">Cerrar sesión</button>
        </div>
      </aside>

      <main class="flex-1 min-w-0">
        <router-outlet/>
      </main>
    </div>
  `,
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
