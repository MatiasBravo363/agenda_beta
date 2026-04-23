import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SiTieneDirective } from '../directives/si-tiene.directive';
import pkg from '../../../../package.json';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SiTieneDirective],
  template: `
    <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <aside
        class="relative border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-[width] duration-300 ease-in-out"
        [style.width]="collapsed() ? '4rem' : '16rem'"
      >
        <button
          type="button"
          (click)="toggle()"
          class="absolute top-6 -right-3 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-md flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-brand-400 transition-colors"
          [title]="collapsed() ? 'Expandir' : 'Colapsar'"
        >
          <span class="text-sm leading-none transition-transform duration-300" [class.rotate-180]="collapsed()">‹</span>
        </button>

        <div class="p-6 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap overflow-hidden">
          @if (!collapsed()) {
            <div class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Agenda<span class="text-brand-600 dark:text-brand-500">_BETA</span></div>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-xs text-slate-500 dark:text-slate-400">Bermann SpA</span>
              <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">V{{ version }}</span>
            </div>
          } @else {
            <div class="text-xl font-extrabold tracking-tight text-center text-brand-600 dark:text-brand-500">A</div>
          }
        </div>

        <nav class="flex-1 p-2 space-y-1 text-sm">
          <a *appSiTiene="'dashboard.ver'" routerLink="/dashboard" routerLinkActive="bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
             [title]="collapsed() ? 'Dashboard' : ''">
            <span class="text-lg">📊</span>
            @if (!collapsed()) { <span>Dashboard</span> }
          </a>
          <a *appSiTiene="'visitas.ver'" routerLink="/visitas" routerLinkActive="bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
             [title]="collapsed() ? 'Visitas' : ''">
            <span class="text-lg">📅</span>
            @if (!collapsed()) { <span>Visitas</span> }
          </a>
          <a *appSiTiene="'historial.ver'" routerLink="/historial" routerLinkActive="bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
             [title]="collapsed() ? 'Historial' : ''">
            <span class="text-lg">🕑</span>
            @if (!collapsed()) { <span>Historial</span> }
          </a>

          @if (!collapsed()) {
            <div class="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Mantenedores</div>
          } @else {
            <div class="my-2 border-t border-slate-200 dark:border-slate-700 mx-2"></div>
          }

          <a *appSiTiene="'tecnicos.ver'" routerLink="/tecnicos" routerLinkActive="bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
             [title]="collapsed() ? 'Técnicos' : ''">
            <span class="text-lg">🔧</span>
            @if (!collapsed()) { <span>Técnicos</span> }
          </a>
          <a *appSiTiene="'tipos_visita.ver'" routerLink="/tipos-visita" routerLinkActive="bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
             [title]="collapsed() ? 'Tipos de visita' : ''">
            <span class="text-lg">🏷️</span>
            @if (!collapsed()) { <span>Tipos de visita</span> }
          </a>
          <a *appSiTiene="'usuarios.ver'" routerLink="/usuarios" routerLinkActive="bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
             [title]="collapsed() ? 'Usuarios' : ''">
            <span class="text-lg">👤</span>
            @if (!collapsed()) { <span>Usuarios</span> }
          </a>
          <a *appSiTiene="'tipos_usuario.gestionar'" routerLink="/tipos-usuario" routerLinkActive="bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
             [title]="collapsed() ? 'Tipos de usuario' : ''">
            <span class="text-lg">🛡️</span>
            @if (!collapsed()) { <span>Tipos de usuario</span> }
          </a>
          <a *appSiTiene="'configuracion.ver'" routerLink="/configuracion" routerLinkActive="bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap"
             [title]="collapsed() ? 'Configuración' : ''">
            <span class="text-lg">⚙️</span>
            @if (!collapsed()) { <span>Configuración</span> }
          </a>
        </nav>

        <div class="p-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          @if (!collapsed()) {
            <div class="truncate mb-2">{{ auth.user()?.email }}</div>
            <button class="btn-secondary w-full" (click)="logout()">Cerrar sesión</button>
          } @else {
            <button class="btn-secondary w-full px-0" (click)="logout()" title="Cerrar sesión">⏻</button>
          }
        </div>
      </aside>

      <main class="flex-1 min-w-0 text-slate-900 dark:text-slate-100">
        <router-outlet/>
      </main>
    </div>
  `,
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  collapsed = signal(this.readPref());
  version = (pkg as { version: string }).version;

  toggle() {
    const next = !this.collapsed();
    this.collapsed.set(next);
    try { localStorage.setItem('agenda_sidebar_collapsed', next ? '1' : '0'); } catch {}
  }

  private readPref(): boolean {
    try { return localStorage.getItem('agenda_sidebar_collapsed') === '1'; } catch { return false; }
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
