import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivitiesService } from '../../core/services/activities.service';
import { Actividad, EstadoActividad, Tecnico } from '../../core/models';
import { colorDeActividad, colorDeEstado, ESTADO_LABEL, ESTADOS } from '../../core/utils/estado.util';
import { TechniciansService } from '../../core/services/technicians.service';
import { SpotlightCardComponent } from '../../shared/components/spotlight-card.component';
import { ActivityFormComponent } from './activity-form.component';
import { SiTieneDirective } from '../../shared/directives/si-tiene.directive';

interface GrupoDia {
  key: string;       // 'YYYY-MM-DD' o '__sin__'
  label: string;     // 'Lunes 21 de abril de 2026' o 'Sin fecha'
  items: Actividad[];
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function diaKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function labelDia(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS_LARGOS[date.getDay()]} ${d} de ${MESES[m - 1]} de ${y}`;
}

type SortKey = 'numero' | 'creador' | 'creado' | 'horario' | 'estado' | 'cliente' | 'tipo' | 'ubicacion';
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
  imports: [FormsModule, RouterLink, DatePipe, SpotlightCardComponent, ActivityFormComponent, SiTieneDirective],
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
          <button *appSiTiene="'actividades.exportar'" class="btn-secondary" (click)="exportXlsx()">Exportar a Excel</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <!-- Mini-calendario -->
        <aside class="card p-3 h-fit space-y-3">
          <div class="flex items-center justify-between">
            <button class="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" (click)="mesAnterior()" aria-label="Mes anterior">‹</button>
            <div class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {{ mesLabel() }}
            </div>
            <button class="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" (click)="mesSiguiente()" aria-label="Mes siguiente">›</button>
          </div>

          <div class="grid grid-cols-7 gap-0.5 text-center text-[10px] uppercase text-slate-400">
            @for (d of diasSemana; track d) { <div>{{ d }}</div> }
          </div>

          <div class="grid grid-cols-7 gap-0.5 text-xs">
            @for (c of celdasMes(); track $index) {
              @if (c.key) {
                <button
                  class="aspect-square flex items-center justify-center rounded relative transition"
                  [class.text-slate-400]="!c.mesActual"
                  [class.text-slate-700]="c.mesActual"
                  [class.dark:text-slate-200]="c.mesActual"
                  [class.bg-brand-600]="c.key === diaSeleccionado()"
                  [class.text-white]="c.key === diaSeleccionado()"
                  [class.hover:bg-slate-100]="c.key !== diaSeleccionado()"
                  [class.dark:hover:bg-slate-800]="c.key !== diaSeleccionado()"
                  [class.ring-1]="c.hoy && c.key !== diaSeleccionado()"
                  [class.ring-brand-400]="c.hoy && c.key !== diaSeleccionado()"
                  (click)="seleccionarDia(c.key)">
                  {{ c.dia }}
                  @if (c.tieneActividad) {
                    <span class="absolute bottom-1 w-1 h-1 rounded-full"
                          [class.bg-white]="c.key === diaSeleccionado()"
                          [class.bg-brand-500]="c.key !== diaSeleccionado()"></span>
                  }
                </button>
              } @else {
                <div class="aspect-square"></div>
              }
            }
          </div>

          @if (diaSeleccionado()) {
            <button class="btn-secondary w-full text-xs" (click)="seleccionarDia(null)">Ver todos los días</button>
          }
        </aside>

        <!-- Tabla agrupada -->
        <div class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase">
              <tr>
                <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('numero')">ID {{ arrow('numero') }}</th>
                <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('creador')">Usuario creador {{ arrow('creador') }}</th>
                <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('horario')">Horario {{ arrow('horario') }}</th>
                <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('estado')">Estado {{ arrow('estado') }}</th>
                <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('cliente')">Cliente {{ arrow('cliente') }}</th>
                <th class="text-left px-4 py-3">Técnicos</th>
                <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('tipo')">Tipo actividad {{ arrow('tipo') }}</th>
                <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('ubicacion')">Ubicación {{ arrow('ubicacion') }}</th>
                <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('creado')">Fecha creación {{ arrow('creado') }}</th>
                <th class="w-40"></th>
              </tr>
            </thead>
            <tbody>
              @if (filtradas().length === 0) {
                <tr><td colspan="10" class="px-4 py-10 text-center text-slate-400">Sin actividades</td></tr>
              }
              @for (g of gruposPorDia(); track g.key) {
                <tr class="bg-slate-100 dark:bg-slate-800 border-t-4 border-brand-500">
                  <td colspan="10" class="px-4 py-4 text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">
                    {{ g.label }}
                    <span class="ml-2 text-slate-400 dark:text-slate-500 font-normal text-xs">· {{ g.items.length }}</span>
                  </td>
                </tr>
                @for (a of g.items; track a.id) {
                  <tr class="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400" [title]="a.id">#{{ a.numero ?? '—' }}</td>
                    <td class="px-4 py-2.5">{{ a.creado_por ? (a.creado_por.nombre + ' ' + a.creado_por.apellido) : '—' }}</td>
                    <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">{{ a.fecha_inicio ? (a.fecha_inicio | date:'HH:mm') : '—' }}</td>
                    <td class="px-4 py-2.5">
                      <button type="button" class="chip chip-estado text-white hover:brightness-110 transition cursor-pointer"
                              [style.background]="color(a)"
                              (click)="abrirEdicion(a); $event.stopPropagation()"
                              title="Editar actividad">
                        {{ ESTADO_LABEL[a.estado] }}
                      </button>
                    </td>
                    <td class="px-4 py-2.5 font-medium">{{ a.nombre_cliente }}</td>
                    <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      @if (a.tecnicos?.length) {
                        <div class="flex flex-wrap gap-1">
                          @for (t of a.tecnicos; track t.id) {
                            <span class="chip bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{{ t.nombre }} {{ t.apellidos }}</span>
                          }
                        </div>
                      } @else {
                        —
                      }
                    </td>
                    <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      @if (a.tipos_actividad?.length) {
                        <div class="flex flex-wrap gap-1">
                          @for (t of a.tipos_actividad; track t.id) {
                            <span class="chip bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{{ t.nombre }}</span>
                          }
                        </div>
                      } @else {
                        {{ a.tipo_actividad?.nombre || '—' }}
                      }
                    </td>
                    <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">{{ a.ubicacion || '—' }}</td>
                    <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">{{ a.created_at ? (a.created_at | date:'dd-MM-yyyy HH:mm') : '—' }}</td>
                    <td class="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                      <a class="text-brand-600 hover:underline" [routerLink]="['/actividades', a.id]">Abrir</a>
                      <button class="text-slate-500 hover:underline" (click)="clone(a)">Clonar</button>
                      <button *appSiTiene="'actividades.borrar'" class="text-red-600 hover:underline" (click)="remove(a)">Borrar</button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal edición -->
    @if (editandoId()) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-start justify-center p-4 overflow-auto" (click)="cerrarEdicion()">
        <div class="w-full max-w-3xl mt-8" (click)="$event.stopPropagation()">
          <app-activity-form
            [idEmbed]="editandoId()!"
            (guardado)="onGuardado()"
            (cancelado)="cerrarEdicion()">
          </app-activity-form>
        </div>
      </div>
    }
  `,
})
export class ActivitiesListComponent implements OnInit {
  private svc = inject(ActivitiesService);
  private techSvc = inject(TechniciansService);

  items = signal<Actividad[]>([]);
  tecnicos = signal<Tecnico[]>([]);

  pendiente: FiltrosAplicados = { ...FILTROS_VACIOS };
  aplicados = signal<FiltrosAplicados>({ ...FILTROS_VACIOS });

  sortKey = signal<SortKey>('horario');
  sortDir = signal<SortDir>('asc');

  diaSeleccionado = signal<string | null>(null);
  editandoId = signal<string | null>(null);
  private hoyDate = new Date();
  mesVisible = signal<{ year: number; month: number }>({
    year: this.hoyDate.getFullYear(),
    month: this.hoyDate.getMonth(),
  });

  diasSemana = DIAS_SEMANA;

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
    const dia = this.diaSeleccionado();
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
      if (dia) {
        if (diaKey(a.fecha_inicio) !== dia) return false;
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

  gruposPorDia = computed<GrupoDia[]>(() => {
    const map = new Map<string, Actividad[]>();
    for (const a of this.filtradas()) {
      const k = diaKey(a.fecha_inicio) ?? '__sin__';
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (a === '__sin__') return 1;
      if (b === '__sin__') return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    });
    return keys.map((k) => ({
      key: k,
      label: k === '__sin__' ? 'Sin fecha' : labelDia(k),
      items: map.get(k)!,
    }));
  });

  diasConActividades = computed<Set<string>>(() => {
    const s = new Set<string>();
    for (const a of this.items()) {
      const k = diaKey(a.fecha_inicio);
      if (k) s.add(k);
    }
    return s;
  });

  mesLabel = computed(() => {
    const m = this.mesVisible();
    return `${MESES[m.month]} ${m.year}`;
  });

  celdasMes = computed(() => {
    const { year, month } = this.mesVisible();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay(); // 0=dom
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const hoyKey = diaKey(new Date().toISOString());
    const conAct = this.diasConActividades();

    const cells: Array<{ key: string | null; dia: number; mesActual: boolean; hoy: boolean; tieneActividad: boolean }> = [];

    for (let i = 0; i < startOffset; i++) cells.push({ key: null, dia: 0, mesActual: false, hoy: false, tieneActividad: false });

    const pad = (n: number) => `${n}`.padStart(2, '0');
    for (let d = 1; d <= diasEnMes; d++) {
      const k = `${year}-${pad(month + 1)}-${pad(d)}`;
      cells.push({ key: k, dia: d, mesActual: true, hoy: k === hoyKey, tieneActividad: conAct.has(k) });
    }
    while (cells.length % 7 !== 0) cells.push({ key: null, dia: 0, mesActual: false, hoy: false, tieneActividad: false });
    return cells;
  });

  mesAnterior() {
    const m = this.mesVisible();
    const nm = m.month === 0 ? 11 : m.month - 1;
    const ny = m.month === 0 ? m.year - 1 : m.year;
    this.mesVisible.set({ year: ny, month: nm });
  }
  mesSiguiente() {
    const m = this.mesVisible();
    const nm = m.month === 11 ? 0 : m.month + 1;
    const ny = m.month === 11 ? m.year + 1 : m.year;
    this.mesVisible.set({ year: ny, month: nm });
  }
  seleccionarDia(k: string | null) {
    this.diaSeleccionado.set(this.diaSeleccionado() === k ? null : k);
  }
  abrirEdicion(a: Actividad) { this.editandoId.set(a.id); }
  cerrarEdicion() { this.editandoId.set(null); }
  async onGuardado() {
    this.editandoId.set(null);
    await this.reload();
  }

  private sortValue(a: Actividad, key: SortKey): string | number {
    switch (key) {
      case 'numero': return a.numero ?? 0;
      case 'creador': return a.creado_por ? `${a.creado_por.nombre} ${a.creado_por.apellido}` : '';
      case 'creado': return a.created_at ? new Date(a.created_at).getTime() : 0;
      case 'horario': return a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : Number.MAX_SAFE_INTEGER;
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

  async remove(a: Actividad) {
    if (!confirm(`¿Eliminar actividad de "${a.nombre_cliente}"? Esta acción no se puede deshacer.`)) return;
    await this.svc.remove(a.id);
    await this.reload();
  }

  async exportXlsx() {
    const ExcelJS = (await import('exceljs')).default ?? (await import('exceljs'));
    const { saveAs } = await import('file-saver');
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
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Actividades');
    if (rows.length) {
      ws.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 18 }));
      rows.forEach((r) => ws.addRow(r));
      ws.getRow(1).font = { bold: true };
    }
    const buf = await wb.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 10);
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `actividades-${stamp}.xlsx`);
  }

  private fmt(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
