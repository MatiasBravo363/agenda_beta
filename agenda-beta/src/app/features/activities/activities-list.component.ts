import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import { ActivitiesService } from '../../core/services/activities.service';
import { Actividad, EstadoActividad, Tecnico } from '../../core/models';
import { colorDeActividad, ESTADO_LABEL, ESTADOS } from '../../core/utils/estado.util';
import { TechniciansService } from '../../core/services/technicians.service';
import { SpotlightCardComponent } from '../../shared/components/spotlight-card.component';

type SortKey = 'id' | 'cliente' | 'tecnico' | 'tipo' | 'estado' | 'inicio' | 'ubicacion';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-activities-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, SpotlightCardComponent],
  template: `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <app-spotlight-card
          title="Coordinadas sin técnico"
          [count]="kpiCoordinadasSinTec()"
          hint="Actividades coordinadas con cliente sin técnico asignado"
          tone="indigo"
        ></app-spotlight-card>
        <app-spotlight-card
          title="Sin técnico · faltan <24 hrs"
          [count]="kpiMenos24hSinTec()"
          hint="Inminentes (<24h) sin técnico asignado"
          tone="rose"
        ></app-spotlight-card>
      </div>

      <div class="flex flex-wrap items-end gap-3 card p-4">
        <div>
          <label class="label">Cliente</label>
          <select class="input" [(ngModel)]="filtroCliente">
            <option value="">Todos</option>
            @for (c of clientes(); track c) { <option [value]="c">{{ c }}</option> }
          </select>
        </div>
        <div>
          <label class="label">Buscar</label>
          <input class="input" [(ngModel)]="filtroBusqueda" placeholder="Texto libre…"/>
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
        <div>
          <label class="label">Desde</label>
          <input class="input" type="date" [(ngModel)]="filtroDesde"/>
        </div>
        <div>
          <label class="label">Hasta</label>
          <input class="input" type="date" [(ngModel)]="filtroHasta"/>
        </div>
        <div class="ml-auto flex items-center gap-3">
          <span class="text-sm text-slate-500">{{ filtradas().length }} resultado(s)</span>
          <button class="btn-secondary" (click)="exportXlsx()">Exportar a Excel</button>
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('id')">ID {{ arrow('id') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('cliente')">Cliente {{ arrow('cliente') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('tecnico')">Técnico {{ arrow('tecnico') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('tipo')">Tipo {{ arrow('tipo') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('estado')">Estado {{ arrow('estado') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('inicio')">Inicio {{ arrow('inicio') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('ubicacion')">Ubicación {{ arrow('ubicacion') }}</th>
              <th class="w-40"></th>
            </tr>
          </thead>
          <tbody>
            @for (a of filtradas(); track a.id) {
              <tr class="border-t border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-2.5 font-mono text-xs text-slate-500" [title]="a.id">{{ a.id.slice(0,8) }}</td>
                <td class="px-4 py-2.5 font-medium">{{ a.nombre_cliente }}</td>
                <td class="px-4 py-2.5">
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
                <td class="px-4 py-2.5 text-slate-600">{{ a.tipo_actividad?.nombre || '-' }}</td>
                <td class="px-4 py-2.5">
                  <span class="chip text-white" [style.background]="color(a)">{{ ESTADO_LABEL[a.estado] }}</span>
                </td>
                <td class="px-4 py-2.5 text-slate-600">{{ a.fecha_inicio ? (a.fecha_inicio | date:'dd-MM-yyyy HH:mm') : '-' }}</td>
                <td class="px-4 py-2.5 text-slate-600">{{ a.ubicacion || '-' }}</td>
                <td class="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                  <a class="text-brand-600 hover:underline" [routerLink]="['/actividades', a.id]">Abrir</a>
                  <button class="text-slate-500 hover:underline" (click)="clone(a)">Clonar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="px-4 py-10 text-center text-slate-400">Sin actividades</td></tr>
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
  filtroBusqueda = '';
  filtroEstado: EstadoActividad | '' = '';
  filtroTecnico: string = '';
  filtroDesde = '';
  filtroHasta = '';

  sortKey = signal<SortKey>('inicio');
  sortDir = signal<SortDir>('asc');

  estados = ESTADOS;
  ESTADO_LABEL = ESTADO_LABEL;

  clientes = computed(() => {
    const set = new Set<string>();
    this.items().forEach((a) => a.nombre_cliente && set.add(a.nombre_cliente));
    return Array.from(set).sort();
  });

  kpiCoordinadasSinTec = computed(() =>
    this.items().filter((a) => a.estado === 'coordinado_con_cliente' && !a.tecnico_id).length
  );

  kpiMenos24hSinTec = computed(() => {
    const now = Date.now();
    const lim = now + 24 * 3600 * 1000;
    return this.items().filter((a) => {
      if (a.tecnico_id) return false;
      if (!a.fecha_inicio) return false;
      if (a.estado === 'completada' || a.estado === 'visita_fallida') return false;
      const t = new Date(a.fecha_inicio).getTime();
      return t >= now && t <= lim;
    }).length;
  });

  filtradas = computed(() => {
    const q = this.filtroBusqueda.trim().toLowerCase();
    const desde = this.filtroDesde ? new Date(this.filtroDesde + 'T00:00:00').getTime() : null;
    const hasta = this.filtroHasta ? new Date(this.filtroHasta + 'T23:59:59').getTime() : null;
    const key = this.sortKey();
    const mult = this.sortDir() === 'asc' ? 1 : -1;

    const list = this.items().filter((a) => {
      if (this.filtroCliente && a.nombre_cliente !== this.filtroCliente) return false;
      if (q) {
        const hay = `${a.nombre_cliente ?? ''} ${a.ubicacion ?? ''} ${a.tecnico?.nombre ?? ''} ${a.tecnico?.apellidos ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (this.filtroEstado && a.estado !== this.filtroEstado) return false;
      if (this.filtroTecnico === '__sin__' && a.tecnico_id) return false;
      if (this.filtroTecnico && this.filtroTecnico !== '__sin__' && a.tecnico_id !== this.filtroTecnico) return false;
      if (desde != null || hasta != null) {
        if (!a.fecha_inicio) return false;
        const t = new Date(a.fecha_inicio).getTime();
        if (desde != null && t < desde) return false;
        if (hasta != null && t > hasta) return false;
      }
      return true;
    });

    return list.sort((x, y) => {
      const av = this.sortValue(x, key);
      const bv = this.sortValue(y, key);
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return 0;
    });
  });

  private sortValue(a: Actividad, key: SortKey): string | number {
    switch (key) {
      case 'id': return a.id;
      case 'cliente': return a.nombre_cliente ?? '';
      case 'tecnico': return a.tecnico ? `${a.tecnico.nombre} ${a.tecnico.apellidos}` : '';
      case 'tipo': return a.tipo_actividad?.nombre ?? '';
      case 'estado': return ESTADO_LABEL[a.estado] ?? a.estado;
      case 'inicio': return a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : 0;
      case 'ubicacion': return a.ubicacion ?? '';
    }
  }

  toggleSort(k: SortKey) {
    if (this.sortKey() === k) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(k);
      this.sortDir.set('asc');
    }
  }

  arrow(k: SortKey) {
    if (this.sortKey() !== k) return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

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

  exportXlsx() {
    const rows = this.filtradas().map((a) => ({
      ID: a.id,
      Cliente: a.nombre_cliente,
      Técnico: a.tecnico ? `${a.tecnico.nombre} ${a.tecnico.apellidos}` : 'Sin asignar',
      Tipo: a.tipo_actividad?.nombre ?? '',
      Estado: ESTADO_LABEL[a.estado] ?? a.estado,
      Inicio: a.fecha_inicio ? this.fmt(a.fecha_inicio) : '',
      Fin: a.fecha_fin ? this.fmt(a.fecha_fin) : '',
      Ubicación: a.ubicacion ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Actividades');
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `actividades-${stamp}.xlsx`);
  }

  private fmt(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
