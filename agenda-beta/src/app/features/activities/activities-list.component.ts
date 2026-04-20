import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import { ActivitiesService } from '../../core/services/activities.service';
import { Actividad, EstadoActividad, Tecnico } from '../../core/models';
import { colorDeActividad, colorDeEstado, ESTADO_LABEL, ESTADOS } from '../../core/utils/estado.util';
import { TechniciansService } from '../../core/services/technicians.service';
import { SpotlightCardComponent } from '../../shared/components/spotlight-card.component';

type SortKey = 'numero' | 'creador' | 'creado' | 'estado' | 'cliente' | 'tipo' | 'ubicacion';
type SortDir = 'asc' | 'desc';

interface FiltrosAplicados {
  cliente: string;
  busqueda: string;
  estado: EstadoActividad | '';
  tecnico: string;
  desde: string;
  hasta: string;
}

const FILTROS_VACIOS: FiltrosAplicados = { cliente: '', busqueda: '', estado: '', tecnico: '', desde: '', hasta: '' };

@Component({
  selector: 'app-activities-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, SpotlightCardComponent],
  template: `
    <div class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        @for (e of estados; track e) {
          <app-spotlight-card
            [title]="ESTADO_LABEL[e]"
            [count]="kpiPorEstado()[e]"
            [customColor]="colorDeEstado(e)"
          ></app-spotlight-card>
        }
      </div>

      <div class="card p-4 space-y-3">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="label">Cliente</label>
            <select class="input" [(ngModel)]="pendiente.cliente">
              <option value="">Todos</option>
              @for (c of clientes(); track c) { <option [value]="c">{{ c }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Buscar</label>
            <input class="input" [(ngModel)]="pendiente.busqueda" (keyup.enter)="aplicarFiltros()" placeholder="Texto libre…"/>
          </div>
          <div>
            <label class="label">Estado</label>
            <select class="input" [(ngModel)]="pendiente.estado">
              <option value="">Todos</option>
              @for (e of estados; track e) { <option [value]="e">{{ ESTADO_LABEL[e] }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Técnico</label>
            <select class="input" [(ngModel)]="pendiente.tecnico">
              <option value="">Todos</option>
              <option value="__sin__">Sin asignar</option>
              @for (t of tecnicos(); track t.id) {
                <option [value]="t.id">{{ t.nombre }} {{ t.apellidos }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label">Desde</label>
            <input class="input" type="date" [(ngModel)]="pendiente.desde"/>
          </div>
          <div>
            <label class="label">Hasta</label>
            <input class="input" type="date" [(ngModel)]="pendiente.hasta"/>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-primary" (click)="aplicarFiltros()">Buscar</button>
          <button class="btn-secondary" (click)="limpiarFiltros()">Limpiar</button>
          <span class="text-sm text-slate-500 ml-auto">{{ filtradas().length }} resultado(s)</span>
          <button class="btn-secondary" (click)="exportXlsx()">Exportar a Excel</button>
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('numero')">ID {{ arrow('numero') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('creador')">Usuario creador {{ arrow('creador') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('creado')">Fecha creación {{ arrow('creado') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('estado')">Estado {{ arrow('estado') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('cliente')">Cliente {{ arrow('cliente') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('tipo')">Tipo actividad {{ arrow('tipo') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('ubicacion')">Ubicación {{ arrow('ubicacion') }}</th>
              <th class="w-40"></th>
            </tr>
          </thead>
          <tbody>
            @for (a of filtradas(); track a.id) {
              <tr class="border-t border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-2.5 font-mono text-xs text-slate-600" [title]="a.id">#{{ a.numero ?? '—' }}</td>
                <td class="px-4 py-2.5">{{ a.creado_por ? (a.creado_por.nombre + ' ' + a.creado_por.apellido) : '—' }}</td>
                <td class="px-4 py-2.5 text-slate-600">{{ a.created_at ? (a.created_at | date:'dd-MM-yyyy HH:mm') : '—' }}</td>
                <td class="px-4 py-2.5">
                  <span class="chip text-white" [style.background]="color(a)">{{ ESTADO_LABEL[a.estado] }}</span>
                </td>
                <td class="px-4 py-2.5 font-medium">{{ a.nombre_cliente }}</td>
                <td class="px-4 py-2.5 text-slate-600">{{ a.tipo_actividad?.nombre || '—' }}</td>
                <td class="px-4 py-2.5 text-slate-600">{{ a.ubicacion || '—' }}</td>
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

  pendiente: FiltrosAplicados = { ...FILTROS_VACIOS };
  aplicados = signal<FiltrosAplicados>({ ...FILTROS_VACIOS });

  sortKey = signal<SortKey>('numero');
  sortDir = signal<SortDir>('desc');

  estados = ESTADOS;
  ESTADO_LABEL = ESTADO_LABEL;

  clientes = computed(() => {
    const set = new Set<string>();
    this.items().forEach((a) => a.nombre_cliente && set.add(a.nombre_cliente));
    return Array.from(set).sort();
  });

  kpiPorEstado = computed<Record<EstadoActividad, number>>(() => {
    const base: Record<EstadoActividad, number> = {
      en_cola: 0, coordinado_con_cliente: 0, agendado_con_tecnico: 0,
      visita_fallida: 0, completada: 0,
    };
    this.items().forEach((a) => {
      if (a.estado === 'en_cola') base.en_cola += a.cantidad_pendiente ?? 1;
      else base[a.estado]++;
    });
    return base;
  });

  colorDeEstado = colorDeEstado;

  filtradas = computed(() => {
    const f = this.aplicados();
    const q = f.busqueda.trim().toLowerCase();
    const desde = f.desde ? new Date(f.desde + 'T00:00:00').getTime() : null;
    const hasta = f.hasta ? new Date(f.hasta + 'T23:59:59').getTime() : null;
    const key = this.sortKey();
    const mult = this.sortDir() === 'asc' ? 1 : -1;

    const list = this.items().filter((a) => {
      if (f.cliente && a.nombre_cliente !== f.cliente) return false;
      if (q) {
        const hay = `${a.nombre_cliente ?? ''} ${a.ubicacion ?? ''} ${a.tecnico?.nombre ?? ''} ${a.tecnico?.apellidos ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.estado && a.estado !== f.estado) return false;
      if (f.tecnico === '__sin__' && a.tecnico_id) return false;
      if (f.tecnico && f.tecnico !== '__sin__' && a.tecnico_id !== f.tecnico) return false;
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
      case 'numero': return a.numero ?? 0;
      case 'creador': return a.creado_por ? `${a.creado_por.nombre} ${a.creado_por.apellido}` : '';
      case 'creado': return a.created_at ? new Date(a.created_at).getTime() : 0;
      case 'estado': return ESTADO_LABEL[a.estado] ?? a.estado;
      case 'cliente': return a.nombre_cliente ?? '';
      case 'tipo': return a.tipo_actividad?.nombre ?? '';
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

  aplicarFiltros() { this.aplicados.set({ ...this.pendiente }); }

  limpiarFiltros() {
    this.pendiente = { ...FILTROS_VACIOS };
    this.aplicados.set({ ...FILTROS_VACIOS });
  }

  async ngOnInit() {
    this.setRangoSemanaActual();
    await Promise.all([this.reload(), this.loadTecnicos()]);
    this.aplicarFiltros();
  }

  private setRangoSemanaActual() {
    const now = new Date();
    const dia = now.getDay(); // 0=domingo
    const offsetLunes = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(now);
    lunes.setDate(now.getDate() + offsetLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const fmt = (d: Date) => {
      const pad = (n: number) => `${n}`.padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    this.pendiente.desde = fmt(lunes);
    this.pendiente.hasta = fmt(domingo);
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
      ID: a.numero ?? '',
      'Usuario creador': a.creado_por ? `${a.creado_por.nombre} ${a.creado_por.apellido}` : '',
      'Fecha creación': a.created_at ? this.fmt(a.created_at) : '',
      Estado: ESTADO_LABEL[a.estado] ?? a.estado,
      Cliente: a.nombre_cliente,
      'Tipo actividad': a.tipo_actividad?.nombre ?? '',
      Ubicación: a.ubicacion ?? '',
      Técnico: a.tecnico ? `${a.tecnico.nombre} ${a.tecnico.apellidos}` : 'Sin asignar',
      Inicio: a.fecha_inicio ? this.fmt(a.fecha_inicio) : '',
      Fin: a.fecha_fin ? this.fmt(a.fecha_fin) : '',
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
