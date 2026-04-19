import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivitiesService } from '../../core/services/activities.service';
import { Actividad, EstadoActividad } from '../../core/models';
import { colorDeActividad, ESTADO_LABEL, ESTADOS } from '../../core/utils/estado.util';
import { TechniciansService } from '../../core/services/technicians.service';
import { Tecnico } from '../../core/models';

@Component({
  selector: 'app-activities-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-end gap-3 card p-4">
        <div>
          <label class="label">Buscar cliente</label>
          <input class="input" [(ngModel)]="filtroCliente" placeholder="Nombre cliente…"/>
        </div>
        <div>
          <label class="label">Estado</label>
          <select class="input" [(ngModel)]="filtroEstado">
            <option value="">Todos</option>
            @for (e of estados; track e) { <option [value]="e">{{ ESTADO_LABEL[e] }}</option> }
          </select>
        </div>
        <div>
          <label class="label">Técnico</label>
          <select class="input" [(ngModel)]="filtroTecnico">
            <option value="">Todos</option>
            <option value="__sin__">Sin asignar</option>
            @for (t of tecnicos(); track t.id) {
              <option [value]="t.id">{{ t.nombre }} {{ t.apellidos }}</option>
            }
          </select>
        </div>
        <div class="ml-auto text-sm text-slate-500">{{ filtradas().length }} resultado(s)</div>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th class="text-left px-4 py-3 w-2">Estado</th>
              <th class="text-left px-4 py-3">Cliente</th>
              <th class="text-left px-4 py-3">Técnico</th>
              <th class="text-left px-4 py-3">Tipo</th>
              <th class="text-left px-4 py-3">Inicio</th>
              <th class="text-left px-4 py-3">Ubicación</th>
              <th class="w-40"></th>
            </tr>
          </thead>
          <tbody>
            @for (a of filtradas(); track a.id) {
              <tr class="border-t border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-3">
                  <span class="inline-block w-3 h-3 rounded-full" [style.background]="color(a)" [title]="ESTADO_LABEL[a.estado]"></span>
                </td>
                <td class="px-4 py-3 font-medium">{{ a.nombre_cliente }}</td>
                <td class="px-4 py-3">
                  @if (a.tecnico) {
                    <span class="font-medium">{{ a.tecnico.nombre }} {{ a.tecnico.apellidos }}</span>
                    <span class="chip ml-2"
                          [class.bg-brand-100]="a.tecnico.tecnico_bermann"
                          [class.text-brand-700]="a.tecnico.tecnico_bermann"
                          [class.bg-slate-100]="!a.tecnico.tecnico_bermann"
                          [class.text-slate-600]="!a.tecnico.tecnico_bermann">
                      {{ a.tecnico.tecnico_bermann ? 'Bermann' : a.tecnico.tipo }}
                    </span>
                  } @else {
                    <span class="text-slate-400 italic">Sin asignar</span>
                  }
                </td>
                <td class="px-4 py-3 text-slate-600">{{ a.tipo_actividad?.nombre || '-' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ a.fecha_inicio ? (a.fecha_inicio | date:'dd-MM-yyyy HH:mm') : '-' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ a.ubicacion || '-' }}</td>
                <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <a class="text-brand-600 hover:underline" [routerLink]="['/actividades', a.id]">Abrir</a>
                  <button class="text-slate-500 hover:underline" (click)="clone(a)">Clonar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="px-4 py-10 text-center text-slate-400">Sin actividades</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ActivitiesListComponent implements OnInit {
  private svc = inject(ActivitiesService);
  private techSvc = inject(TechniciansService);

  items = signal<Actividad[]>([]);
  tecnicos = signal<Tecnico[]>([]);
  filtroCliente = '';
  filtroEstado: EstadoActividad | '' = '';
  filtroTecnico: string = '';

  estados = ESTADOS;
  ESTADO_LABEL = ESTADO_LABEL;

  filtradas = computed(() => {
    const q = this.filtroCliente.trim().toLowerCase();
    return this.items().filter((a) => {
      if (q && !a.nombre_cliente.toLowerCase().includes(q)) return false;
      if (this.filtroEstado && a.estado !== this.filtroEstado) return false;
      if (this.filtroTecnico === '__sin__' && a.tecnico_id) return false;
      if (this.filtroTecnico && this.filtroTecnico !== '__sin__' && a.tecnico_id !== this.filtroTecnico) return false;
      return true;
    });
  });

  async ngOnInit() {
    await Promise.all([this.reload(), this.loadTecnicos()]);
  }
  async reload() { this.items.set(await this.svc.list()); }
  async loadTecnicos() { this.tecnicos.set(await this.techSvc.list()); }

  color(a: Actividad) { return colorDeActividad(a, a.tecnico); }

  async clone(a: Actividad) {
    if (!confirm(`¿Clonar actividad de "${a.nombre_cliente}"?`)) return;
    await this.svc.clone(a.id);
    await this.reload();
  }
}
