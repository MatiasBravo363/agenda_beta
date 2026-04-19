import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

import { ActivitiesService } from '../../core/services/activities.service';
import { TechniciansService } from '../../core/services/technicians.service';
import { ActivityTypesService } from '../../core/services/activity-types.service';
import { Actividad, EstadoActividad, Tecnico, TipoActividad } from '../../core/models';
import { colorDeActividad, ESTADO_LABEL, ESTADOS } from '../../core/utils/estado.util';

@Component({
  selector: 'app-activities-calendar',
  standalone: true,
  imports: [FullCalendarModule, FormsModule],
  template: `
    <div class="card p-4 space-y-4">
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

    <div class="flex flex-wrap gap-3 mt-4 text-xs text-slate-600">
      <span class="chip" style="background:#dbeafe;color:#1e40af">● En cola</span>
      <span class="chip" style="background:#fee2e2;color:#991b1b">● Coordinado con cliente</span>
      <span class="chip" style="background:#ffedd5;color:#9a3412">● Agendado (externo/regional)</span>
      <span class="chip" style="background:#dcfce7;color:#166534">● Agendado (externo Santiago)</span>
      <span class="chip" style="background:#e5e7eb;color:#374151">● Visita fallida</span>
    </div>
  `,
})
export class ActivitiesCalendarComponent implements OnInit {
  private svc = inject(ActivitiesService);
  private techSvc = inject(TechniciansService);
  private typeSvc = inject(ActivityTypesService);
  private router = inject(Router);

  items = signal<Actividad[]>([]);
  tecnicos = signal<Tecnico[]>([]);
  tipos = signal<TipoActividad[]>([]);

  fTecnico = signal<string>('');
  fEstado = signal<EstadoActividad | ''>('');
  fTipo = signal<string>('');

  msg = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  estados = ESTADOS;
  ESTADO_LABEL = ESTADO_LABEL;

  filtered = computed<Actividad[]>(() => {
    const t = this.fTecnico();
    const e = this.fEstado();
    const tp = this.fTipo();
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
  }));

  async ngOnInit() {
    const [acts, tecs, typs] = await Promise.all([
      this.svc.list(),
      this.techSvc.list(),
      this.typeSvc.list(),
    ]);
    this.items.set(acts);
    this.tecnicos.set(tecs);
    this.tipos.set(typs);
  }

  clearFilters() {
    this.fTecnico.set('');
    this.fEstado.set('');
    this.fTipo.set('');
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
        const rango = a.fecha_fin
          ? `${hhmm(a.fecha_inicio!)}-${hhmm(a.fecha_fin)}`
          : hhmm(a.fecha_inicio!);
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
