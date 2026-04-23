import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-visitas-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageHeaderComponent],
  template: `
    <app-page-header title="Visitas" subtitle="Programa, asigna y sigue el avance de las visitas en terreno.">
      <div class="flex gap-1 bg-slate-100 rounded-lg p-1">
        <a class="px-3 py-1.5 text-sm rounded-md" routerLink="lista"
           routerLinkActive="bg-white shadow text-brand-700 font-medium">Lista</a>
        <a class="px-3 py-1.5 text-sm rounded-md" routerLink="calendario"
           routerLinkActive="bg-white shadow text-brand-700 font-medium">Calendario</a>
      </div>
      <a class="btn-primary" routerLink="nueva">+ Nueva visita</a>
    </app-page-header>
    <div class="p-4 sm:p-8"><router-outlet/></div>
  `,
})
export class VisitasShellComponent {}
