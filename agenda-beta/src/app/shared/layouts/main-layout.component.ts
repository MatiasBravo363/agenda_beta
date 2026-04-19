import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-slate-50">
      <aside
        class="relative border-r border-slate-200 bg-white flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out"
        [style.width]="collapsed() ? '4rem' : '16rem'"
      >
        <button
          type="button"
          (click)="toggle()"
          class="absolute top-5 -right-3 z-10 w-6 h-6 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors"
          [title]="collapsed() ? 'Expandir' : 'Colapsar'"
        >
          <span class="text-xs leading-none transition-transform duration-300" [class.rotate-180]="collapsed()">‹</span>
        </button>

        <div class="p-6 border-b border-slate-200 whitespace-nowrap">
          @if (!collapsed()) {
            <div class="text-xl font-extrabold tracking-tight">Agenda<span class="text-brand-600">_BETA</span></div>
            <div class="text-xs text-slate-500 mt-1">Bermann S.A.</div>
          } @else {
            <div class="text-xl font-extrabold tracking-tight text-center text-brand-600">A</div>
          }
        </div>

        <nav class="flex-1 p-2 space-y-1 text-sm">
          <a routerLink="/actividades" routerLinkActive="bg-brand-50 text-brand-700"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap"
             [title]="collapsed() ? 'Actividades' : ''">
            <span class="text-lg">📅</span>
            @if (!collapsed()) { <span>Actividades</span> }
          </a>
          <a routerLink="/historial" routerLinkActive="bg-brand-50 text-brand-700"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap"
             [title]="collapsed() ? 'Historial' : ''">
            <span class="text-lg">🕑</span>
            @if (!collapsed()) { <span>Historial</span> }
          </a>

          @if (!collapsed()) {
            <div class="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-slate-400">Mantenedores</div>
          } @else {
            <div class="my-2 border-t border-slate-200 mx-2"></div>
          }

          <a routerLink="/tecnicos" routerLinkActive="bg-brand-50 text-brand-700"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap"
             [title]="collapsed() ? 'Técnicos' : ''">
            <span class="text-lg">🔧</span>
            @if (!collapsed()) { <span>Técnicos</span> }
          </a>
          <a routerLink="/tipos-actividad" routerLinkActive="bg-brand-50 text-brand-700"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap"
             [title]="collapsed() ? 'Tipos de actividad' : ''">
            <span class="text-lg">🏷️</span>
            @if (!collapsed()) { <span>Tipos de actividad</span> }
          </a>
          <a routerLink="/usuarios" routerLinkActive="bg-brand-50 text-brand-700"
             class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap"
             [title]="collapsed() ? 'Usuarios' : ''">
            <span class="text-lg">👤</span>
            @if (!collapsed()) { <span>Usuarios</span> }
          </a>
        </nav>

        <div class="p-3 border-t border-slate-200 text-xs text-slate-500">
          @if (!collapsed()) {
            <div class="truncate mb-2">{{ auth.user()?.email }}</div>
            <button class="btn-secondary w-full" (click)="logout()">Cerrar sesión</button>
          } @else {
            <button class="btn-secondary w-full px-0" (click)="logout()" title="Cerrar sesión">⏻</button>
          }
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
  collapsed = signal(this.readPref());

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
