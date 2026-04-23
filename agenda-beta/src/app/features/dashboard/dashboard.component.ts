import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { VisitasService } from '../../core/services/visitas.service';
import { TechniciansService } from '../../core/services/technicians.service';
import { ActividadesService } from '../../core/services/actividades.service';
import { Actividad, Visita, Tecnico } from '../../core/models';
import { ESTADO_LABEL, ESTADOS, colorDeEstado } from '../../core/utils/estado.util';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

interface TipoSlice {
  nombre: string;
  count: number;
  pct: number;
  color: string;
}

const TIPO_PALETTE = ['#6366f1', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#a855f7', '#ec4899', '#14b8a6'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, NgxEchartsDirective, PageHeaderComponent],
  template: `
    <app-page-header title="Dashboard" subtitle="Vista global de visitas con filtros y gráficos."></app-page-header>

    <div class="p-8 space-y-6">
      <!-- Filtros -->
      <div class="card p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label class="label">Desde</label>
            <input class="input" type="date" [ngModel]="fDesde()" (ngModelChange)="fDesde.set($event)"/>
          </div>
          <div>
            <label class="label">Hasta</label>
            <input class="input" type="date" [ngModel]="fHasta()" (ngModelChange)="fHasta.set($event)"/>
          </div>
          <div>
            <label class="label">Técnico</label>
            <select class="input" [ngModel]="fTecnico()" (ngModelChange)="fTecnico.set($event)">
              <option value="">Todos</option>
              @for (t of tecnicos(); track t.id) {
                <option [value]="t.id">{{ t.nombre }} {{ t.apellidos }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label">Cliente</label>
            <select class="input" [ngModel]="fCliente()" (ngModelChange)="fCliente.set($event)">
              <option value="">Todos</option>
              @for (c of clientes(); track c) { <option [value]="c">{{ c }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Tipo</label>
            <select class="input" [ngModel]="fTipo()" (ngModelChange)="fTipo.set($event)">
              <option value="">Todos</option>
              @for (tp of tipos(); track tp.id) { <option [value]="tp.id">{{ tp.nombre }}</option> }
            </select>
          </div>
        </div>
        <div class="flex justify-end mt-3">
          <button class="btn-secondary" (click)="limpiar()">Limpiar</button>
        </div>
      </div>

      <!-- Global card -->
      <div class="card p-6 space-y-4">
        <div class="flex items-baseline justify-between">
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-500">Global</div>
            <div class="text-4xl font-bold mt-1">{{ total() }}</div>
            <div class="text-xs text-slate-500 mt-1">Visitaes en el rango</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-slate-500">vs periodo anterior</div>
            <div class="text-2xl font-semibold" [style.color]="diffColor()">
              {{ diffLabel() }}
            </div>
            <div class="text-xs text-slate-400">({{ totalAnterior() }} previo)</div>
          </div>
        </div>

        <div>
          <div class="text-xs text-slate-500 mb-2">Distribución por actividad (excluye En cola)</div>
          @if (distribTipos().length > 0) {
            <div class="flex h-4 rounded-md overflow-hidden border border-slate-200">
              @for (s of distribTipos(); track s.nombre) {
                <div [style.flex]="'0 0 ' + (s.pct < 2 ? 2 : s.pct) + '%'"
                     [style.background]="s.color"
                     [title]="s.nombre + ' · ' + s.count + ' (' + s.pct.toFixed(1) + '%)'"></div>
              }
            </div>
            <div class="flex flex-wrap gap-3 mt-3 text-xs">
              @for (s of distribTipos(); track s.nombre) {
                <div class="flex items-center gap-1.5">
                  <span class="inline-block w-3 h-3 rounded-sm" [style.background]="s.color"></span>
                  <span class="text-slate-700">{{ s.nombre }}</span>
                  <span class="text-slate-500">{{ s.pct.toFixed(1) }}%</span>
                </div>
              }
            </div>
          } @else {
            <div class="text-xs text-slate-400">Sin datos suficientes.</div>
          }
        </div>
      </div>

      <!-- Gráfico líneas -->
      <div class="card p-4">
        <div class="text-sm font-semibold text-slate-700 mb-2">Visitaes por fecha (por estado)</div>
        <div echarts [options]="chartOptions()" class="w-full" style="height: 360px"></div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private svc = inject(VisitasService);
  private techSvc = inject(TechniciansService);
  private typeSvc = inject(ActividadesService);

  items = signal<Visita[]>([]);
  tecnicos = signal<Tecnico[]>([]);
  tipos = signal<Actividad[]>([]);

  fDesde = signal('');
  fHasta = signal('');
  fTecnico = signal('');
  fCliente = signal('');
  fTipo = signal('');

  async ngOnInit() {
    this.setRangoMesActual();
    const [acts, tecs, typs] = await Promise.all([this.svc.list(), this.techSvc.list(), this.typeSvc.list()]);
    this.items.set(acts);
    this.tecnicos.set(tecs);
    this.tipos.set(typs);
  }

  private setRangoMesActual() {
    const now = new Date();
    const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => {
      const pad = (n: number) => `${n}`.padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    this.fDesde.set(fmt(inicio));
    this.fHasta.set(fmt(fin));
  }

  limpiar() {
    this.setRangoMesActual();
    this.fTecnico.set(''); this.fCliente.set(''); this.fTipo.set('');
  }

  clientes = computed(() => {
    const set = new Set<string>();
    this.items().forEach((a) => a.nombre_cliente && set.add(a.nombre_cliente));
    return Array.from(set).sort();
  });

  private rangoTimestamps = computed(() => ({
    desde: this.fDesde() ? new Date(this.fDesde() + 'T00:00:00').getTime() : null,
    hasta: this.fHasta() ? new Date(this.fHasta() + 'T23:59:59').getTime() : null,
  }));

  private pasa(a: Visita): boolean {
    if (this.fTecnico() && a.tecnico_id !== this.fTecnico()) return false;
    if (this.fCliente() && a.nombre_cliente !== this.fCliente()) return false;
    if (this.fTipo() && a.actividad_id !== this.fTipo()) return false;
    return true;
  }

  filtered = computed<Visita[]>(() => {
    const { desde, hasta } = this.rangoTimestamps();
    return this.items().filter((a) => {
      if (!this.pasa(a)) return false;
      if (desde != null || hasta != null) {
        if (!a.fecha_inicio) return false;
        const t = new Date(a.fecha_inicio).getTime();
        if (desde != null && t < desde) return false;
        if (hasta != null && t > hasta) return false;
      }
      return true;
    });
  });

  filteredAnterior = computed<Visita[]>(() => {
    const { desde, hasta } = this.rangoTimestamps();
    if (desde == null || hasta == null) return [];
    const durMs = hasta - desde;
    const prevHasta = desde - 1;
    const prevDesde = prevHasta - durMs;
    return this.items().filter((a) => {
      if (!this.pasa(a)) return false;
      if (!a.fecha_inicio) return false;
      const t = new Date(a.fecha_inicio).getTime();
      return t >= prevDesde && t <= prevHasta;
    });
  });

  total = computed(() => this.filtered().length);
  totalAnterior = computed(() => this.filteredAnterior().length);

  diff = computed(() => {
    const cur = this.total();
    const prev = this.totalAnterior();
    if (prev === 0) return cur === 0 ? 0 : 100;
    return ((cur - prev) / prev) * 100;
  });

  diffLabel = computed(() => {
    const d = this.diff();
    const sign = d > 0 ? '▲' : d < 0 ? '▼' : '●';
    return `${sign} ${Math.abs(d).toFixed(1)}%`;
  });

  diffColor = computed(() => {
    const d = this.diff();
    if (d > 0) return '#15803d';
    if (d < 0) return '#b91c1c';
    return '#64748b';
  });

  distribTipos = computed<TipoSlice[]>(() => {
    const list = this.filtered().filter((a) => a.estado !== 'en_cola');
    const total = list.length;
    if (total === 0) return [];
    const map = new Map<string, number>();
    list.forEach((a) => {
      const k = a.actividad?.nombre ?? 'Sin actividad';
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, count], i) => ({
        nombre, count, pct: (count / total) * 100,
        color: TIPO_PALETTE[i % TIPO_PALETTE.length],
      }));
  });

  chartOptions = computed<EChartsOption>(() => {
    const list = this.filtered().filter((a) => a.fecha_inicio);
    const desde = this.fDesde() ? new Date(this.fDesde() + 'T00:00:00') : null;
    const hasta = this.fHasta() ? new Date(this.fHasta() + 'T00:00:00') : null;
    const fmt = (d: Date) => {
      const p = (n: number) => `${n}`.padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    };

    let xDays: string[];
    if (desde && hasta) {
      xDays = [];
      const cur = new Date(desde);
      while (cur.getTime() <= hasta.getTime()) {
        xDays.push(fmt(cur));
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      const dias = new Set<string>();
      list.forEach((a) => dias.add(a.fecha_inicio!.slice(0, 10)));
      xDays = Array.from(dias).sort();
    }

    const estadosGraficables = ESTADOS.filter((e) => e !== 'en_cola');
    const series = estadosGraficables.map((e) => ({
      name: ESTADO_LABEL[e],
      type: 'line' as const,
      smooth: true,
      itemStyle: { color: colorDeEstado(e) },
      lineStyle: { color: colorDeEstado(e) },
      data: xDays.map(
        (d) => list.filter((a) => a.estado === e && a.fecha_inicio!.slice(0, 10) === d).length
      ),
    }));

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: estadosGraficables.map((e) => ESTADO_LABEL[e]), bottom: 0 },
      grid: { left: 40, right: 20, top: 20, bottom: 50 },
      xAxis: { type: 'category', data: xDays, boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1 },
      series,
    };
  });

  ESTADO_LABEL = ESTADO_LABEL;
  estados = ESTADOS;
  colorDeEstado = colorDeEstado;
}
