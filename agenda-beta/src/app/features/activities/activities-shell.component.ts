import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-activities-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PageHeaderComponent],
  template: `
    <app-page-header title="Actividades" subtitle="Programa, asigna y sigue el avance de las actividades en terreno.">
      <div class="flex gap-1 bg-slate-100 rounded-lg p-1">
        <a class="px-3 py-1.5 text-sm rounded-md" routerLink="lista"
           routerLinkActive="bg-white shadow text-brand-700 font-medium">Lista</a>
        <a class="px-3 py-1.5 text-sm rounded-md" routerLink="calendario"
           routerLinkActive="bg-white shadow text-brand-700 font-medium">Calendario</a>
      </div>
      <a class="btn-primary" routerLink="nueva">+ Nueva actividad</a>
    </app-page-header>
    <div class="p-8"><router-outlet/></div>
  `,
})
export class ActivitiesShellComponent {}
