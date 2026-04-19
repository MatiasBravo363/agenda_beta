import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import { Draggable, EventResizeDoneArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

import { ActivitiesService } from '../../core/services/activities.service';
import { TechniciansService } from '../../core/services/technicians.service';
import { ActivityTypesService } from '../../core/services/activity-types.service';
import { Actividad, EstadoActividad, Tecnico, TipoActividad } from '../../core/models';
import { colorDeActividad, ESTADO_LABEL, ESTADOS } from '../../core/utils/estado.util';

interface DropPending {
  actividad: Actividad;
  start: Date;
}

@Component({
  selector: 'app-activities-calendar',
  standalone: true,
  imports: [FullCalendarModule, FormsModule],
  template: `
    <div class="flex gap-4">
      <!-- Panel en_cola -->
      <aside class="w-72 shrink-0 card p-4 space-y-3 h-fit sticky top-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-slate-700">En cola</h3>
          <button class="text-xs text-brand-600 hover:underline" (click)="toggleCreate()">
            {{ showCreate() ? 'Cancelar' : '+ Nueva' }}
          </button>
        </div>

        @if (showCreate()) {
          <div class="space-y-2 p-3 rounded-md bg-slate-50 border border-slate-200">
            <div>
              <label class="label">Cliente *</label>
              <input class="input" [(ngModel)]="nuevo.cliente" placeholder="Nombre cliente"/>
            </div>
            <div>
              <label class="label">Tipo *</label>
              <select class="input" [(ngModel)]="nuevo.tipo_id">
                <option [ngValue]="null">—</option>
                @for (tp of tipos(); track tp.id) { <option [ngValue]="tp.id">{{ tp.nombre }}</option> }
              </select>
            </div>
            <div>
              <label class="label">Técnico</label>
              <select class="input" [(ngModel)]="nuevo.tecnico_id">
                <option [ngValue]="null">—</option>
                @for (t of tecnicos(); track t.id) {
                  <option [ngValue]="t.id">{{ t.nombre }} {{ t.apellidos }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label">Ubicación</label>
              <input class="input" [(ngModel)]="nuevo.ubicacion"/>
            </div>
            <button class="btn-primary w-full" (click)="createEnCola()" [disabled]="creating()">
              {{ creating() ? 'Creando…' : 'Crear en cola' }}
            </button>
          </div>
        }

        <div #colaList class="space-y-2 max-h-[70vh] overflow-auto">
          @for (a of enCola(); track a.id) {
            <div class="encola-card group rounded-md border border-slate-200 bg-white p-3 cursor-grab hover:shadow-md hover:border-brand-300 transition"
                 [attr.data-actividad-id]="a.id">
              <div class="flex items-center justify-between gap-2">
                <div class="font-medium text-sm truncate">{{ a.nombre_cliente }}</div>
                <div class="text-xs text-slate-500 truncate">
                  {{ a.tecnico ? (a.tecnico.nombre + ' ' + a.tecnico.apellidos) : 'Sin asignar' }}
                </div>
              </div>
              <div class="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
                <div class="overflow-hidden">
                  <div class="pt-2 mt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div>Tipo: <span class="font-medium">{{ a.tipo_actividad?.nombre ?? '—' }}</span></div>
                    <div>
                      Estado:
                      <span class="chip text-white" [style.background]="colorDe(a)">{{ ESTADO_LABEL[a.estado] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-xs text-slate-400 text-center py-6">No hay actividades en cola.</div>
          }
        </div>
      </aside>

      <!-- Calendario -->
      <div class="flex-1 min-w-0 card p-4 space-y-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div>
            <label class="label">Técnico</label>
            <select class="input" [ngModel]="fTecnico()" (ngModelChange)="fTecnico.set($event)">
              <option [ngValue]="''">Todos</option>
              @for (t of tecnicos(); track t.id) {
                <option [ngValue]="t.id">{{ t.nombre }} {{ t.apellidos }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label">Estado</label>
            <select class="input" [ngModel]="fEstado()" (ngModelChange)="fEstado.set($event)">
              <option [ngValue]="''">Todos</option>
              @for (e of estados; track e) { <option [ngValue]="e">{{ ESTADO_LABEL[e] }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Tipo</label>
            <select class="input" [ngModel]="fTipo()" (ngModelChange)="fTipo.set($event)">
              <option [ngValue]="''">Todos</option>
              @for (tp of tipos(); track tp.id) { <option [ngValue]="tp.id">{{ tp.nombre }}</option> }
            </select>
          </div>
          <button class="btn-secondary ml-auto" (click)="clearFilters()">Limpiar filtros</button>
        </div>

        <full-calendar [options]="options()"></full-calendar>

        @if (msg(); as m) {
          <div class="text-sm rounded-md px-3 py-2"
               [class.bg-green-50]="m.type==='ok'" [class.text-green-700]="m.type==='ok'"
               [class.bg-red-50]="m.type==='err'" [class.text-red-700]="m.type==='err'">
            {{ m.text }}
          </div>
        }
      </div>
    </div>

    <!-- Modal drop -->
    @if (dropPending()) {
      <div class="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4" (click)="cancelDrop()">
        <div class="card p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <h3 class="font-semibold text-slate-800">Agendar actividad</h3>
          <div class="text-sm text-slate-600">
            <div><strong>{{ dropPending()!.actividad.nombre_cliente }}</strong></div>
            <div>Inicio: {{ formatStart() }}</div>
          </div>

          <div>
            <label class="label">Nuevo estado</label>
            <select class="input" [(ngModel)]="dropEstado">
              @for (e of estados; track e) {
                @if (e !== 'en_cola') { <option [value]="e">{{ ESTADO_LABEL[e] }}</option> }
              }
            </select>
          </div>

          <div>
            <label class="label">Duración (minutos)</label>
            <input class="input" type="number" min="15" step="15" [(ngModel)]="dropDuracion"/>
          </div>

          <div class="flex gap-2 justify-end pt-2">
            <button class="btn-secondary" (click)="cancelDrop()" [disabled]="confirming()">Cancelar</button>
            <button class="btn-primary" (click)="confirmDrop()" [disabled]="confirming()">
              {{ confirming() ? 'Guardando…' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ActivitiesCalendarComponent implements OnInit, AfterViewInit, OnDestroy {
  private svc = inject(ActivitiesService);
  private techSvc = inject(TechniciansService);
  private typeSvc = inject(ActivityTypesService);
  private router = inject(Router);

  @ViewChild('colaList', { static: false }) colaList?: ElementRef<HTMLDivElement>;
  private draggable?: Draggable;

  items = signal<Actividad[]>([]);
  tecnicos = signal<Tecnico[]>([]);
  tipos = signal<TipoActividad[]>([]);

  fTecnico = signal<string>('');
  fEstado = signal<EstadoActividad | ''>('');
  fTipo = signal<string>('');

  msg = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  estados = ESTADOS;
  ESTADO_LABEL = ESTADO_LABEL;

  // Panel en cola
  showCreate = signal(false);
  creating = signal(false);
  nuevo = { cliente: '', tipo_id: null as string | null, tecnico_id: null as string | null, ubicacion: '' };

  // Modal drop
  dropPending = signal<DropPending | null>(null);
  dropEstado: EstadoActividad = 'coordinado_con_cliente';
  dropDuracion = 60;
  confirming = signal(false);

  enCola = computed(() => this.items().filter((a) => a.estado === 'en_cola'));

  filtered = computed<Actividad[]>(() => {
    const t = this.fTecnico(); const e = this.fEstado(); const tp = this.fTipo();
    return this.items().filter((a) => {
      if (t && a.tecnico_id !== t) return false;
      if (e && a.estado !== e) return false;
      if (tp && a.tipo_actividad_id !== tp) return false;
      return true;
    });
  });

  options = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    locale: 'es',
    firstDay: 1,
    nowIndicator: true,
    editable: true,
    droppable: true,
    eventResizableFromStart: true,
    slotDuration: '00:30:00',
    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',
    scrollTime: '06:00:00',
    selectable: true,
    selectMirror: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', list: 'Lista' },
    height: 'auto',
    events: this.toEvents(this.filtered()),
    eventClick: (arg) => this.router.navigate(['/actividades', arg.event.id]),
    eventDrop: (arg) => this.onEventChange(arg),
    eventResize: (arg) => this.onEventChange(arg),
    select: (arg: DateSelectArg) => this.onRangeSelect(arg),
    drop: (info) => this.onExternalDrop(info.date, info.draggedEl),
  }));

  async ngOnInit() {
    await this.reloadAll();
  }

  ngAfterViewInit() {
    if (this.colaList) {
      this.draggable = new Draggable(this.colaList.nativeElement, {
        itemSelector: '.encola-card',
      });
    }
  }

  ngOnDestroy() { this.draggable?.destroy(); }

  async reloadAll() {
    const [acts, tecs, typs] = await Promise.all([
      this.svc.list(), this.techSvc.list(), this.typeSvc.list(),
    ]);
    this.items.set(acts);
    this.tecnicos.set(tecs);
    this.tipos.set(typs);
  }

  clearFilters() { this.fTecnico.set(''); this.fEstado.set(''); this.fTipo.set(''); }

  colorDe(a: Actividad) { return colorDeActividad(a, a.tecnico); }

  toggleCreate() {
    this.showCreate.set(!this.showCreate());
    if (!this.showCreate()) this.resetNuevo();
  }

  private resetNuevo() {
    this.nuevo = { cliente: '', tipo_id: null, tecnico_id: null, ubicacion: '' };
  }

  async createEnCola() {
    if (!this.nuevo.cliente.trim()) { this.flash('err', 'Cliente es obligatorio.'); return; }
    if (!this.nuevo.tipo_id) { this.flash('err', 'Tipo es obligatorio.'); return; }
    this.creating.set(true);
    try {
      await this.svc.create({
        nombre_cliente: this.nuevo.cliente.trim(),
        tipo_actividad_id: this.nuevo.tipo_id,
        tecnico_id: this.nuevo.tecnico_id,
        ubicacion: this.nuevo.ubicacion || null,
        estado: 'en_cola',
        fecha_inicio: null,
        fecha_fin: null,
      });
      this.resetNuevo();
      this.showCreate.set(false);
      await this.reloadAll();
      this.flash('ok', 'Actividad creada en cola.');
    } catch (e: any) {
      this.flash('err', e?.message ?? 'No se pudo crear.');
    } finally {
      this.creating.set(false);
    }
  }

  private onExternalDrop(date: Date, el: HTMLElement) {
    const id = el.dataset['actividadId'];
    if (!id) return;
    const actividad = this.items().find((a) => a.id === id);
    if (!actividad) return;
    this.dropPending.set({ actividad, start: date });
    this.dropEstado = 'coordinado_con_cliente';
    this.dropDuracion = 60;
  }

  formatStart(): string {
    const p = this.dropPending();
    if (!p) return '';
    const d = p.start;
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  cancelDrop() { if (!this.confirming()) this.dropPending.set(null); }

  async confirmDrop() {
    const p = this.dropPending();
    if (!p) return;
    this.confirming.set(true);
    try {
      const start = p.start;
      const end = new Date(start.getTime() + this.dropDuracion * 60000);
      await this.svc.update(p.actividad.id, {
        fecha_inicio: start.toISOString(),
        fecha_fin: end.toISOString(),
        estado: this.dropEstado,
      });
      await this.reloadAll();
      this.dropPending.set(null);
      this.flash('ok', 'Actividad agendada.');
    } catch (e: any) {
      this.flash('err', e?.message ?? 'No se pudo agendar.');
    } finally {
      this.confirming.set(false);
    }
  }

  private onRangeSelect(arg: DateSelectArg) {
    const start = arg.start.toISOString();
    const end = arg.end.toISOString();
    this.router.navigate(['/actividades', 'nueva'], { queryParams: { start, end } });
  }

  private async onEventChange(arg: EventDropArg | EventResizeDoneArg) {
    const id = arg.event.id;
    const start = arg.event.start?.toISOString() ?? null;
    const end = arg.event.end?.toISOString() ?? null;
    try {
      await this.svc.update(id, { fecha_inicio: start, fecha_fin: end });
      this.items.set(this.items().map((a) => (a.id === id ? { ...a, fecha_inicio: start, fecha_fin: end } : a)));
      this.flash('ok', 'Actividad reubicada.');
    } catch (e: any) {
      arg.revert();
      this.flash('err', e?.message ?? 'No se pudo actualizar.');
    }
  }

  private flash(type: 'ok' | 'err', text: string) {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 3500);
  }

  private toEvents(list: Actividad[]): EventInput[] {
    return list
      .filter((a) => a.fecha_inicio)
      .map((a) => {
        const color = colorDeActividad(a, a.tecnico);
        const tecnico = a.tecnico ? `${a.tecnico.nombre} ${a.tecnico.apellidos}` : 'Sin asignar';
        const pad = (n: number) => `${n}`.padStart(2, '0');
        const hhmm = (iso: string) => {
          const d = new Date(iso);
          return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        const rango = a.fecha_fin ? `${hhmm(a.fecha_inicio!)}-${hhmm(a.fecha_fin)}` : hhmm(a.fecha_inicio!);
        return {
          id: a.id,
          title: `${rango} · ${a.nombre_cliente} · ${tecnico}`,
          start: a.fecha_inicio!,
          end: a.fecha_fin ?? undefined,
          backgroundColor: color,
          borderColor: color,
          textColor: '#fff',
          extendedProps: { estado: ESTADO_LABEL[a.estado], tecnico },
        };
      });
  }
}
