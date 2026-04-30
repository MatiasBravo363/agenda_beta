import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { VisitasService } from '../../core/services/visitas.service';
import { TechniciansService } from '../../core/services/technicians.service';
import { ActividadesService } from '../../core/services/actividades.service';
import { Actividad, EstadoVisita, Visita, Tecnico } from '../../core/models';
import { ESTADO_LABEL, ESTADOS, colorDeEstado } from '../../core/utils/estado.util';
import { ThemeService } from '../../core/theme/theme.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { chartSubtextColor, chartTextColor, chartTooltipBg, chartTooltipBorder, gradientColorByRate, paletteColor, TIPO_PALETTE } from './charts.util';

interface TipoSlice {
  nombre: string;
  count: number;
  pct: number;
  color: string;
}

const DIAS_LABEL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HORAS_LABEL = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`);
const COLOR_BERMANN = '#3b5bdb';
const COLOR_EXTERNO = '#94a3b8';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, NgxEchartsDirective, PageHeaderComponent],
  template: `
    <app-page-header title="Dashboard" subtitle="Vista global de visitas con filtros y gráficos."></app-page-header>

    <div class="p-4 md:p-8 space-y-6">
      <!-- Filtros -->
      <div class="card p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label class="label">Desde</label>
            <input class="input" type="date" [ngModel]="fDesde()" (ngModelChange)="onFechaChange('desde', $event)"/>
          </div>
          <div>
            <label class="label">Hasta</label>
            <input class="input" type="date" [ngModel]="fHasta()" (ngModelChange)="onFechaChange('hasta', $event)"/>
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

      @if (rangoExcedido()) {
        <div class="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <span aria-hidden="true" class="text-2xl">⚠️</span>
          <div class="flex-1">
            <div class="font-semibold text-amber-900 dark:text-amber-100">Rango máximo permitido: 6 meses</div>
            <p class="text-sm text-amber-800 dark:text-amber-200 mt-1">
              Para mantener la performance, las consultas del dashboard están limitadas a un rango de hasta 6 meses.
              Acortá las fechas o volvé a la semana actual para ver los datos.
            </p>
            <button class="btn-primary mt-3" (click)="volverASemanaActual()">Volver a semana actual</button>
          </div>
        </div>
      }

      <!-- KPIs row: 4 cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Total + diff -->
        <div class="card p-4">
          <div class="text-xs uppercase tracking-wider text-slate-500">Total visitas</div>
          <div class="text-3xl font-bold mt-1">{{ total() }}</div>
          <div class="text-xs mt-2" [style.color]="diffColor()">
            {{ diffLabel() }} <span class="text-slate-400">({{ totalAnterior() }} prev)</span>
          </div>
        </div>
        <!-- Tasa cumplimiento -->
        <div class="card p-4">
          <div class="text-xs uppercase tracking-wider text-slate-500">Cumplimiento</div>
          <div class="text-3xl font-bold mt-1">{{ tasaCumplimientoLabel() }}</div>
          <div class="text-xs text-slate-400 mt-2">{{ completadas() }}/{{ completadas() + falladas() }} (compl/total)</div>
        </div>
        <!-- En cola -->
        <div class="card p-4">
          <div class="text-xs uppercase tracking-wider text-slate-500">En cola</div>
          <div class="text-3xl font-bold mt-1" [class.text-red-600]="enColaCount() > 10">
            {{ enColaCount() }}
          </div>
          <div class="text-xs text-slate-400 mt-2">Pendientes de agendar</div>
        </div>
        <!-- Reagendadas -->
        <div class="card p-4">
          <div class="text-xs uppercase tracking-wider text-slate-500">Reagendadas</div>
          <div class="text-3xl font-bold mt-1">{{ reagendadasCount() }}</div>
          <div class="text-xs text-slate-400 mt-2">Clones por fallo (parent_id)</div>
        </div>
      </div>

      <!-- Distribución actividad: barra horizontal segmentada (existente) -->
      <div class="card p-4">
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
                <span class="text-slate-700 dark:text-slate-300">{{ s.nombre }}</span>
                <span class="text-slate-500">{{ s.pct.toFixed(1) }}%</span>
              </div>
            }
          </div>
        } @else {
          <div class="text-xs text-slate-400">Sin datos suficientes.</div>
        }
      </div>

      <!-- Grid principal: line + donut -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card p-4 lg:col-span-2">
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Actividades agendadas por día</div>
          <div echarts [options]="chartActividadesPorDia()" class="w-full" style="height: 360px"></div>
        </div>
        <div class="card p-4">
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Distribución por estado</div>
          <!-- @if delays init hasta que filtered tenga data: echarts pie/funnel/heatmap
               tiene un bug de merge donde si arranca con data:[] y despues llega data:[N items],
               no agrega los slices. Inicializar con data completa de entrada lo evita. -->
          @if (filtered().length > 0) {
            <div echarts [options]="chartDonutEstados()" class="w-full" style="height: 360px"></div>
          } @else {
            <div class="flex items-center justify-center text-xs text-slate-400" style="height: 360px">
              Sin datos en el rango filtrado
            </div>
          }
        </div>
      </div>

      <!-- Grid secundaria: barras técnico + funnel -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-4">
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Distribución por técnico
            <span class="text-xs font-normal text-slate-500 ml-1">(Bermann en azul)</span>
          </div>
          @if (filtered().length > 0) {
            <div echarts [options]="chartBarrasTecnicos()" class="w-full" [style.height.px]="alturaBarrasTecnicos()"></div>
          } @else {
            <div class="flex items-center justify-center text-xs text-slate-400" [style.height.px]="alturaBarrasTecnicos()">
              Sin datos en el rango filtrado
            </div>
          }
        </div>
        <div class="card p-4">
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Funnel de estados
            <span class="text-xs font-normal text-slate-500 ml-1">(snapshot actual, no cumulativo)</span>
          </div>
          @if (filtered().length > 0) {
            <div echarts [options]="chartFunnel()" class="w-full" style="height: 360px"></div>
          } @else {
            <div class="flex items-center justify-center text-xs text-slate-400" style="height: 360px">
              Sin datos en el rango filtrado
            </div>
          }
        </div>
      </div>

      <!-- Heatmap día×hora -->
      <div class="card p-4">
        <div class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Heatmap día × hora
          <span class="text-xs font-normal text-slate-500 ml-1">(solo visitas con fecha)</span>
        </div>
        @if (filtered().length > 0) {
          <div echarts [options]="chartHeatmap()" class="w-full" style="height: 320px"></div>
        } @else {
          <div class="flex items-center justify-center text-xs text-slate-400" style="height: 320px">
            Sin datos en el rango filtrado
          </div>
        }
      </div>

      <!-- Tasa de fallo por actividad -->
      <div class="card p-4">
        <div class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Tasa de fallo por actividad
          <span class="text-xs font-normal text-slate-500 ml-1">(actividades con &lt;3 visitas filtradas)</span>
        </div>
        @if (filtered().length > 0) {
          <div echarts [options]="chartFallosPorActividad()" class="w-full" [style.height.px]="alturaFallos()"></div>
        } @else {
          <div class="flex items-center justify-center text-xs text-slate-400" [style.height.px]="alturaFallos()">
            Sin datos en el rango filtrado
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private svc = inject(VisitasService);
  private techSvc = inject(TechniciansService);
  private typeSvc = inject(ActividadesService);
  private theme = inject(ThemeService);

  items = signal<Visita[]>([]);
  tecnicos = signal<Tecnico[]>([]);
  tipos = signal<Actividad[]>([]);

  fDesde = signal('');
  fHasta = signal('');
  fTecnico = signal('');
  fCliente = signal('');
  fTipo = signal('');

  ESTADO_LABEL = ESTADO_LABEL;
  estados = ESTADOS;
  colorDeEstado = colorDeEstado;

  // 1.0.20: cap de 6 meses para el rango del dashboard. Evita full table scans
  // cuando alguien selecciona "todo el año" por error/curiosidad.
  private static readonly RANGO_MAX_DIAS = 183;

  async ngOnInit() {
    this.setRangoSemanaActual();
    // Catálogos: técnicos y actividades (sin filtro temporal). Las visitas
    // se cargan luego con cargarVisitas() filtrando por el rango activo.
    const [tecs, typs] = await Promise.all([this.techSvc.list(), this.typeSvc.list()]);
    this.tecnicos.set(tecs);
    this.tipos.set(typs);
    await this.cargarVisitas();
  }

  /**
   * Default 1.0.20: semana actual (lunes a domingo). Antes era el mes completo,
   * pero traía hasta 500 visitas con 5-join sin filtro server-side. Ahora la
   * carga inicial es ligera y el usuario puede ampliar el rango (hasta 6 meses)
   * desde el filtro.
   */
  private setRangoSemanaActual() {
    const now = new Date();
    const dia = now.getDay();
    const offsetLunes = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(now);
    lunes.setDate(now.getDate() + offsetLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const fmt = (d: Date) => {
      const pad = (n: number) => `${n}`.padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    this.fDesde.set(fmt(lunes));
    this.fHasta.set(fmt(domingo));
  }

  /**
   * Carga visitas vía listPaged con el rango actual. Si el rango excede 6 meses,
   * no carga nada (el banner del template explica al usuario que acote).
   */
  async cargarVisitas() {
    if (this.rangoExcedido()) {
      this.items.set([]);
      return;
    }
    const desde = this.fDesde();
    const hasta = this.fHasta();
    if (!desde || !hasta) return;
    const result = await this.svc.listPaged({ limit: 1000, offset: 0, desde, hasta });
    this.items.set(result.items);
  }

  /** True si el rango activo es > 6 meses. Se usa para mostrar banner y bloquear charts. */
  rangoExcedido = computed(() => {
    const desde = this.fDesde();
    const hasta = this.fHasta();
    if (!desde || !hasta) return false;
    const d = new Date(desde + 'T00:00:00').getTime();
    const h = new Date(hasta + 'T00:00:00').getTime();
    if (isNaN(d) || isNaN(h) || h < d) return false;
    const dias = (h - d) / 86400000;
    return dias > DashboardComponent.RANGO_MAX_DIAS;
  });

  /** Vuelve a la semana actual y refresca. Usado por el botón del banner de rango excedido. */
  async volverASemanaActual() {
    this.setRangoSemanaActual();
    this.fTecnico.set(''); this.fCliente.set(''); this.fTipo.set('');
    await this.cargarVisitas();
  }

  /**
   * Cuando cambia desde/hasta en el input, setea el signal y recarga visitas
   * (con debounce para evitar fetch storms si el usuario tipea la fecha).
   */
  private fechaTimer: ReturnType<typeof setTimeout> | null = null;
  onFechaChange(campo: 'desde' | 'hasta', valor: string) {
    if (campo === 'desde') this.fDesde.set(valor);
    else this.fHasta.set(valor);
    if (this.fechaTimer) clearTimeout(this.fechaTimer);
    this.fechaTimer = setTimeout(() => this.cargarVisitas(), 300);
  }

  async limpiar() {
    this.setRangoSemanaActual();
    this.fTecnico.set(''); this.fCliente.set(''); this.fTipo.set('');
    await this.cargarVisitas();
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

  // --- KPIs nuevos ---

  completadas = computed(() => this.filtered().filter((v) => v.estado === 'completada').length);
  falladas = computed(() => this.filtered().filter((v) => v.estado === 'visita_fallida').length);

  tasaCumplimiento = computed(() => {
    const c = this.completadas();
    const f = this.falladas();
    if (c + f === 0) return null;
    return (c / (c + f)) * 100;
  });

  tasaCumplimientoLabel = computed(() => {
    const t = this.tasaCumplimiento();
    if (t === null) return '—';
    return `${t.toFixed(1)}%`;
  });

  // En cola se cuenta sobre items completos (sin filtro de fecha) porque
  // las visitas en cola por definición no tienen fecha_inicio.
  enColaCount = computed(() => {
    const tec = this.fTecnico(); const cli = this.fCliente(); const tp = this.fTipo();
    return this.items().filter((a) => {
      if (a.estado !== 'en_cola') return false;
      if (tec && a.tecnico_id !== tec) return false;
      if (cli && a.nombre_cliente !== cli) return false;
      if (tp && a.actividad_id !== tp) return false;
      return true;
    }).reduce((acc, a) => acc + (a.cantidad_pendiente ?? 1), 0);
  });

  reagendadasCount = computed(() => this.filtered().filter((v) => v.parent_visita_id != null).length);

  // --- Distribución por actividad (existente) ---

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

  // --- Helpers de fechas para charts ---

  private xDays = computed<string[]>(() => {
    const list = this.filtered().filter((a) => a.fecha_inicio);
    const desde = this.fDesde() ? new Date(this.fDesde() + 'T00:00:00') : null;
    const hasta = this.fHasta() ? new Date(this.fHasta() + 'T00:00:00') : null;
    const fmt = (d: Date) => {
      const p = (n: number) => `${n}`.padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    };
    if (desde && hasta) {
      const out: string[] = [];
      const cur = new Date(desde);
      while (cur.getTime() <= hasta.getTime()) {
        out.push(fmt(cur));
        cur.setDate(cur.getDate() + 1);
      }
      return out;
    }
    const dias = new Set<string>();
    list.forEach((a) => dias.add(a.fecha_inicio!.slice(0, 10)));
    return Array.from(dias).sort();
  });

  // --- B.1: Line chart de actividades agendadas por día ---

  chartActividadesPorDia = computed<EChartsOption>(() => {
    const dark = this.theme.isDark();
    const list = this.filtered().filter((a) => a.fecha_inicio);
    const days = this.xDays();

    // Agrupar: por cada visita, por cada actividad asociada (multi-asignación), sumar 1 al (día, actividad).
    const counts = new Map<string, Map<string, number>>(); // actividad -> día -> count
    for (const v of list) {
      const dia = v.fecha_inicio!.slice(0, 10);
      const acts = v.actividades && v.actividades.length > 0
        ? v.actividades.map((a) => a.nombre)
        : [v.actividad?.nombre ?? 'Sin actividad'];
      for (const nombre of acts) {
        if (!counts.has(nombre)) counts.set(nombre, new Map());
        const inner = counts.get(nombre)!;
        inner.set(dia, (inner.get(dia) ?? 0) + 1);
      }
    }

    // Si hay >8 actividades, agregar las top 7 + "Otras"
    const totales = Array.from(counts.entries())
      .map(([nombre, m]) => ({ nombre, total: Array.from(m.values()).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total);

    let actividadesFinales: { nombre: string; serie: number[] }[];
    if (totales.length > 8) {
      const top = totales.slice(0, 7);
      const restoNombres = new Set(totales.slice(7).map((x) => x.nombre));
      const otras: number[] = days.map(() => 0);
      for (const nombre of restoNombres) {
        const m = counts.get(nombre)!;
        days.forEach((d, i) => { otras[i] += m.get(d) ?? 0; });
      }
      actividadesFinales = top.map((t) => ({
        nombre: t.nombre,
        serie: days.map((d) => counts.get(t.nombre)!.get(d) ?? 0),
      }));
      actividadesFinales.push({ nombre: 'Otras', serie: otras });
    } else {
      actividadesFinales = totales.map((t) => ({
        nombre: t.nombre,
        serie: days.map((d) => counts.get(t.nombre)!.get(d) ?? 0),
      }));
    }

    return {
      textStyle: { color: chartTextColor(dark) },
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartTooltipBg(dark),
        borderColor: chartTooltipBorder(dark),
        textStyle: { color: chartTextColor(dark) },
      },
      legend: {
        data: actividadesFinales.map((a) => a.nombre),
        bottom: 0,
        type: 'scroll',
        textStyle: { color: chartSubtextColor(dark) },
      },
      grid: { left: 40, right: 20, top: 20, bottom: 50, containLabel: true },
      xAxis: { type: 'category', data: days, boundaryGap: false, axisLabel: { color: chartSubtextColor(dark) } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { color: chartSubtextColor(dark) } },
      series: actividadesFinales.map((a, i) => ({
        name: a.nombre,
        type: 'line' as const,
        smooth: true,
        connectNulls: false,
        itemStyle: { color: paletteColor(i) },
        lineStyle: { color: paletteColor(i) },
        data: a.serie,
      })),
    };
  });

  // --- B.2: Donut de distribución por estado ---

  chartDonutEstados = computed<EChartsOption>(() => {
    const dark = this.theme.isDark();
    const list = this.filtered();
    const counts = new Map<EstadoVisita, number>();
    list.forEach((v) => counts.set(v.estado, (counts.get(v.estado) ?? 0) + 1));

    const data = ESTADOS
      .filter((e) => (counts.get(e) ?? 0) > 0)
      .map((e) => ({
        name: ESTADO_LABEL[e],
        value: counts.get(e) ?? 0,
        itemStyle: { color: colorDeEstado(e) },
      }));

    const totalText = `${list.length}\nvisitas`;

    return {
      textStyle: { color: chartTextColor(dark) },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: chartTooltipBg(dark),
        borderColor: chartTooltipBorder(dark),
        textStyle: { color: chartTextColor(dark) },
      },
      legend: { bottom: 0, type: 'scroll', textStyle: { color: chartSubtextColor(dark) } },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{d}%', color: chartTextColor(dark) },
        labelLine: { show: true },
        data,
      }],
      graphic: {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: totalText,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 600,
          fill: chartTextColor(dark),
        },
      },
    };
  });

  // --- B.3: Barras horizontales por técnico (con destaque Bermann) ---

  /** Datos agregados de técnicos: para el chart Y para la altura dinámica. */
  private tecnicosAgregados = computed(() => {
    const list = this.filtered();
    const total = list.length;
    if (total === 0) return [] as { nombre: string; count: number; pct: number; bermann: boolean }[];

    // Multi-asignación: por cada visita, contar uno por técnico asignado.
    // Si no tiene técnicos asignados, contar como "Sin técnico".
    const map = new Map<string, { nombre: string; count: number; bermann: boolean }>();
    for (const v of list) {
      const tecs = v.tecnicos && v.tecnicos.length > 0 ? v.tecnicos : v.tecnico ? [v.tecnico] : [];
      if (tecs.length === 0) {
        const k = '__sin__';
        const cur = map.get(k) ?? { nombre: 'Sin técnico', count: 0, bermann: false };
        cur.count++;
        map.set(k, cur);
      } else {
        for (const t of tecs) {
          const cur = map.get(t.id) ?? { nombre: `${t.nombre} ${t.apellidos}`, count: 0, bermann: !!t.tecnico_bermann };
          cur.count++;
          map.set(t.id, cur);
        }
      }
    }

    return Array.from(map.values())
      .map((x) => ({ ...x, pct: (x.count / total) * 100 }))
      .sort((a, b) => b.count - a.count);
  });

  alturaBarrasTecnicos = computed(() => {
    const n = this.tecnicosAgregados().length;
    return Math.max(220, Math.min(28 * n + 80, 600));
  });

  chartBarrasTecnicos = computed<EChartsOption>(() => {
    const dark = this.theme.isDark();
    const data = this.tecnicosAgregados();
    // Datos para el chart: yAxis en orden ascendente (mayor abajo), barras paralelas.
    // Echarts pinta yAxis category de arriba a abajo, por eso revertimos para que
    // el técnico con más visitas quede arriba.
    const ordenado = [...data].reverse();
    const counts = ordenado.map((d) => d.count);

    return {
      textStyle: { color: chartTextColor(dark) },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: chartTooltipBg(dark),
        borderColor: chartTooltipBorder(dark),
        textStyle: { color: chartTextColor(dark) },
        formatter: (params: unknown) => {
          const arr = params as { name: string; value: number; dataIndex: number }[];
          if (!arr.length) return '';
          const p = arr[0];
          const orig = ordenado[p.dataIndex];
          return `${p.name}<br/>${orig.count} visitas (${orig.pct.toFixed(1)}%)`;
        },
      },
      grid: { left: 10, right: 80, top: 10, bottom: 30, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: chartSubtextColor(dark) },
        splitLine: { lineStyle: { color: dark ? '#334155' : '#e2e8f0' } },
      },
      yAxis: {
        type: 'category',
        data: ordenado.map((d) => d.nombre),
        axisLabel: { color: chartSubtextColor(dark) },
      },
      series: [{
        type: 'bar',
        data: counts,
        itemStyle: {
          color: (params: unknown) => {
            const idx = (params as { dataIndex: number }).dataIndex;
            return ordenado[idx].bermann ? COLOR_BERMANN : COLOR_EXTERNO;
          },
        },
        label: {
          show: true,
          position: 'right',
          formatter: (p: unknown) => {
            const orig = ordenado[(p as { dataIndex: number }).dataIndex];
            return `${orig.count} (${orig.pct.toFixed(1)}%)`;
          },
          color: dark ? '#cbd5e1' : '#475569',
        },
      }],
    };
  });

  // --- B.4: Funnel snapshot (sin historial — fallback documentado) ---

  chartFunnel = computed<EChartsOption>(() => {
    const dark = this.theme.isDark();
    // Para el funnel sin historial: usar items() (sin filtro de fecha) para cubrir
    // 'en_cola' que por definición no tiene fecha. Aplicar filtros no-fecha.
    const tec = this.fTecnico(); const cli = this.fCliente(); const tp = this.fTipo();
    const filtradosNoFecha = this.items().filter((a) => {
      if (tec && a.tecnico_id !== tec) return false;
      if (cli && a.nombre_cliente !== cli) return false;
      if (tp && a.actividad_id !== tp) return false;
      return true;
    });

    const niveles: EstadoVisita[] = ['en_cola', 'coordinado_con_cliente', 'agendado_con_tecnico', 'completada'];
    const data = niveles.map((e) => ({
      name: ESTADO_LABEL[e],
      value: filtradosNoFecha.filter((v) => v.estado === e).length,
      itemStyle: { color: colorDeEstado(e) },
    }));

    return {
      textStyle: { color: chartTextColor(dark) },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} visitas',
        backgroundColor: chartTooltipBg(dark),
        borderColor: chartTooltipBorder(dark),
        textStyle: { color: chartTextColor(dark) },
      },
      series: [{
        type: 'funnel',
        sort: 'none',
        gap: 2,
        left: '10%',
        right: '10%',
        top: '5%',
        bottom: '5%',
        label: { show: true, position: 'inside', color: '#fff', fontWeight: 600, formatter: '{b}: {c}' },
        data,
      }],
    };
  });

  // --- B.5: Tasa de fallo por actividad ---

  /** Datos agregados de fallos por actividad — usado para el chart y la altura. */
  private fallosAgregados = computed(() => {
    const list = this.filtered();
    const map = new Map<string, { nombre: string; total: number; fallidas: number }>();
    for (const v of list) {
      const acts = v.actividades && v.actividades.length > 0
        ? v.actividades.map((a) => a.nombre)
        : [v.actividad?.nombre ?? 'Sin actividad'];
      for (const nombre of acts) {
        const cur = map.get(nombre) ?? { nombre, total: 0, fallidas: 0 };
        cur.total++;
        if (v.estado === 'visita_fallida') cur.fallidas++;
        map.set(nombre, cur);
      }
    }
    return Array.from(map.values())
      .filter((x) => x.total >= 3)
      .map((x) => ({ ...x, tasa: (x.fallidas / x.total) * 100 }))
      .sort((a, b) => b.tasa - a.tasa);
  });

  alturaFallos = computed(() => {
    const n = this.fallosAgregados().length;
    return Math.max(200, Math.min(32 * n + 60, 600));
  });

  chartFallosPorActividad = computed<EChartsOption>(() => {
    const dark = this.theme.isDark();
    const data = this.fallosAgregados();
    const ordenado = [...data].reverse();
    const tasas = ordenado.map((d) => Number(d.tasa.toFixed(2)));

    return {
      textStyle: { color: chartTextColor(dark) },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: chartTooltipBg(dark),
        borderColor: chartTooltipBorder(dark),
        textStyle: { color: chartTextColor(dark) },
        formatter: (params: unknown) => {
          const arr = params as { name: string; dataIndex: number }[];
          if (!arr.length) return '';
          const p = arr[0];
          const orig = ordenado[p.dataIndex];
          return `${p.name}<br/>${orig.fallidas}/${orig.total} fallidas (${orig.tasa.toFixed(1)}%)`;
        },
      },
      grid: { left: 10, right: 80, top: 10, bottom: 30, containLabel: true },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%', color: chartSubtextColor(dark) },
        splitLine: { lineStyle: { color: dark ? '#334155' : '#e2e8f0' } },
      },
      yAxis: {
        type: 'category',
        data: ordenado.map((d) => d.nombre),
        axisLabel: { color: chartSubtextColor(dark) },
      },
      series: [{
        type: 'bar',
        data: tasas,
        itemStyle: {
          color: (params: unknown) => {
            const idx = (params as { dataIndex: number }).dataIndex;
            return gradientColorByRate(ordenado[idx].tasa);
          },
        },
        label: {
          show: true,
          position: 'right',
          formatter: (p: unknown) => {
            const orig = ordenado[(p as { dataIndex: number }).dataIndex];
            return `${orig.fallidas}/${orig.total} (${orig.tasa.toFixed(0)}%)`;
          },
          color: dark ? '#cbd5e1' : '#475569',
        },
      }],
    };
  });

  // --- B.6: Heatmap día×hora ---

  chartHeatmap = computed<EChartsOption>(() => {
    const dark = this.theme.isDark();
    const list = this.filtered().filter((a) => a.fecha_inicio);

    // Matriz [dia 0-6][hora 0-23] -> count
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    for (const v of list) {
      const d = new Date(v.fecha_inicio!);
      // Lun=0, Dom=6 (getDay devuelve Dom=0..Sáb=6)
      const dia = (d.getDay() + 6) % 7;
      const hora = d.getHours();
      matrix[dia][hora]++;
      if (matrix[dia][hora] > max) max = matrix[dia][hora];
    }

    // Convertir a [hora, dia, count] — formato echarts
    const data: [number, number, number][] = [];
    for (let dia = 0; dia < 7; dia++) {
      for (let hora = 0; hora < 24; hora++) {
        data.push([hora, dia, matrix[dia][hora]]);
      }
    }

    // En dark mode usar gradiente claro→amarillo→naranja para que destaque sobre slate-950.
    // En light mode el azul oscuro funciona bien sobre fondo blanco.
    const inRangeColors = dark
      ? ['#1e293b', '#facc15', '#f97316', '#dc2626']
      : ['#dbeafe', '#3b82f6', '#1e3a8a'];

    return {
      textStyle: { color: chartTextColor(dark) },
      tooltip: {
        position: 'top',
        backgroundColor: chartTooltipBg(dark),
        borderColor: chartTooltipBorder(dark),
        textStyle: { color: chartTextColor(dark) },
        formatter: (p: unknown) => {
          const params = p as { data: [number, number, number] };
          const [h, d, c] = params.data;
          return `${DIAS_LABEL[d]} ${HORAS_LABEL[h]}: ${c} visitas`;
        },
      },
      grid: { left: 50, right: 30, top: 30, bottom: 60, containLabel: true },
      xAxis: {
        type: 'category',
        data: HORAS_LABEL,
        splitArea: { show: true },
        axisLabel: { color: chartSubtextColor(dark) },
      },
      yAxis: {
        type: 'category',
        data: DIAS_LABEL,
        splitArea: { show: true },
        axisLabel: { color: chartSubtextColor(dark) },
      },
      visualMap: {
        min: 0,
        max: Math.max(1, max),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 5,
        textStyle: { color: chartSubtextColor(dark) },
        inRange: { color: inRangeColors },
      },
      series: [{
        type: 'heatmap',
        data,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.3)' } },
      }],
    };
  });
}
