import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActivitiesService } from '../../core/services/activities.service';
import { TechniciansService } from '../../core/services/technicians.service';
import { ActivityTypesService } from '../../core/services/activity-types.service';
import { Actividad, Tecnico, TipoActividad } from '../../core/models';
import { ESTADO_LABEL, ESTADOS, colorDeActividad } from '../../core/utils/estado.util';
import { DireccionAutocompleteComponent, DireccionSeleccionada } from '../../shared/components/direccion-autocomplete.component';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [FormsModule, RouterLink, DireccionAutocompleteComponent],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      @if (!embed) {
        <a routerLink="/actividades" class="text-sm text-slate-500 hover:text-slate-700">← Volver a actividades</a>
      }

      @if (model()) {
        <div class="card p-6 space-y-6">
          <div class="flex items-center gap-3">
            <span class="inline-block w-3.5 h-3.5 rounded-full" [style.background]="color()"></span>
            <div class="text-xl font-bold">{{ isNew ? 'Nueva actividad' : model()!.nombre_cliente }}</div>
            <span class="chip bg-slate-100 text-slate-700 ml-auto">{{ estadoLabel() }}</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="label">Nombre cliente *</label>
              <input class="input" [(ngModel)]="model()!.nombre_cliente" name="nombre_cliente"/>
            </div>

            <div>
              <label class="label">Estado *</label>
              <select class="input" [(ngModel)]="model()!.estado" name="estado">
                @for (e of estados; track e) { <option [value]="e">{{ ESTADO_LABEL[e] }}</option> }
              </select>
            </div>

            <div>
              <label class="label">Tipo de actividad *</label>
              <select class="input" [(ngModel)]="model()!.tipo_actividad_id" name="tipo">
                <option [ngValue]="null">— Seleccionar —</option>
                @for (t of tipos(); track t.id) { <option [ngValue]="t.id">{{ t.nombre }}</option> }
              </select>
            </div>

            <div>
              <label class="label">Técnico asignado</label>
              <select class="input" [(ngModel)]="model()!.tecnico_id" name="tecnico">
                <option [ngValue]="null">— Sin asignar —</option>
                @for (t of tecnicos(); track t.id) {
                  <option [ngValue]="t.id">
                    {{ t.nombre }} {{ t.apellidos }} · {{ t.tecnico_bermann ? 'Bermann' : t.tipo }} · {{ t.region || '—' }}
                  </option>
                }
              </select>
            </div>

            <div>
              <label class="label">Ubicación</label>
              <app-direccion-autocomplete
                [value]="model()!.ubicacion || ''"
                (valueChange)="model()!.ubicacion = $event"
                (selected)="onDireccionSeleccionada($event)"
              ></app-direccion-autocomplete>
            </div>

            <div class="col-span-2 rounded-md border border-slate-200 p-4 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-slate-700">Programación</h4>
                <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" [checked]="modoDuracion()" (change)="toggleModoDuracion($event)"/>
                  Usar duración (calcula fecha fin)
                </label>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Fecha inicio</label>
                  <input class="input" type="datetime-local"
                         [ngModel]="toLocal(model()!.fecha_inicio)"
                         (ngModelChange)="model()!.fecha_inicio = fromLocal($event)" name="fi"/>
                </div>

                @if (!modoDuracion()) {
                  <div>
                    <label class="label">Fecha fin</label>
                    <input class="input" type="datetime-local"
                           [ngModel]="toLocal(model()!.fecha_fin)"
                           (ngModelChange)="model()!.fecha_fin = fromLocal($event)" name="ff"/>
                  </div>
                } @else {
                  <div>
                    <label class="label">Duración (minutos)</label>
                    <input class="input" type="number" min="1" step="1"
                           [ngModel]="duracionMin()"
                           (ngModelChange)="duracionMin.set($event || 0)"
                           [disabled]="!model()!.fecha_inicio" name="dur"/>
                  </div>
                }
              </div>

              @if (modoDuracion()) {
                <div class="flex flex-wrap gap-2">
                  @for (m of [30, 60, 120, 240]; track m) {
                    <button type="button" class="chip bg-slate-100 text-slate-700 hover:bg-slate-200"
                            (click)="duracionMin.set(m)">
                      {{ m }} min
                    </button>
                  }
                </div>
              }

              @if (fechaError(); as fe) {
                <p class="text-xs text-red-600">{{ fe }}</p>
              }
            </div>

            <div class="col-span-2">
              <label class="label">Descripción</label>
              <textarea class="input min-h-[220px] resize-y" [(ngModel)]="model()!.descripcion" name="descripcion"></textarea>
            </div>
          </div>

          @if (error()) { <div class="text-sm text-red-600">{{ error() }}</div> }

          <div class="flex gap-2 justify-end pt-4 border-t border-slate-100">
            @if (!isNew) {
              <button class="btn-secondary" (click)="clone()">Clonar</button>
              <button class="btn-danger" (click)="remove()">Eliminar</button>
            }
            @if (embed) {
              <button class="btn-secondary" (click)="cancel()">Cancelar</button>
            } @else {
              <button class="btn-secondary" routerLink="/actividades">Cancelar</button>
            }
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ActivityFormComponent implements OnInit {
  private svc = inject(ActivitiesService);
  private techSvc = inject(TechniciansService);
  private typeSvc = inject(ActivityTypesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @Input() idEmbed?: string;
  @Output() guardado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  get embed(): boolean { return !!this.idEmbed; }

  model = signal<Partial<Actividad> | null>(null);
  tecnicos = signal<Tecnico[]>([]);
  tipos = signal<TipoActividad[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);
  modoDuracion = signal(false);
  duracionMin = signal(60);
  isNew = true;

  fechaError = computed<string | null>(() => {
    const m = this.model();
    if (!m) return null;
    if (this.modoDuracion()) {
      if (m.fecha_inicio && (!this.duracionMin() || this.duracionMin() <= 0)) {
        return 'La duración debe ser mayor a 0.';
      }
      return null;
    }
    if (m.fecha_inicio && m.fecha_fin && new Date(m.fecha_fin) <= new Date(m.fecha_inicio)) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio.';
    }
    return null;
  });

  estados = ESTADOS;
  ESTADO_LABEL = ESTADO_LABEL;

  async ngOnInit() {
    const [t, tp] = await Promise.all([this.techSvc.list(), this.typeSvc.list()]);
    this.tecnicos.set(t);
    this.tipos.set(tp);

    const id = this.idEmbed ?? this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nueva') {
      this.isNew = false;
      const a = await this.svc.getById(id);
      this.model.set(a ?? null);
    } else {
      this.isNew = true;
      const qp = this.route.snapshot.queryParamMap;
      const start = qp.get('start');
      const end = qp.get('end');
      this.model.set({
        nombre_cliente: '',
        estado: 'en_cola',
        tipo_actividad_id: null,
        tecnico_id: null,
        fecha_inicio: start ?? null,
        fecha_fin: end ?? null,
        ubicacion: '',
        descripcion: '',
      });
    }
  }

  estadoLabel() {
    const e = this.model()?.estado;
    return e ? ESTADO_LABEL[e] : '';
  }

  color() {
    const m = this.model();
    if (!m?.estado) return '#94a3b8';
    const tec = this.tecnicos().find((x) => x.id === m.tecnico_id) ?? null;
    return colorDeActividad({ estado: m.estado }, tec);
  }

  toLocal(v?: string | null): string {
    if (!v) return '';
    const d = new Date(v);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  fromLocal(v: string): string | null {
    return v ? new Date(v).toISOString() : null;
  }

  toggleModoDuracion(ev: Event) {
    const on = (ev.target as HTMLInputElement).checked;
    this.modoDuracion.set(on);
    const m = this.model();
    if (on && m?.fecha_inicio && m?.fecha_fin) {
      const diff = Math.round((new Date(m.fecha_fin).getTime() - new Date(m.fecha_inicio).getTime()) / 60000);
      if (diff > 0) this.duracionMin.set(diff);
    }
  }

  onDireccionSeleccionada(d: DireccionSeleccionada) {
    const m = this.model();
    if (!m) return;
    m.ubicacion = d.display_name;
    m.ubicacion_lat = d.lat;
    m.ubicacion_lng = d.lng;
  }

  async save() {
    const m = this.model();
    if (!m?.nombre_cliente) { this.error.set('El nombre del cliente es obligatorio'); return; }
    if (!m.estado) { this.error.set('El estado es obligatorio'); return; }
    if (!m.tipo_actividad_id) { this.error.set('El tipo de actividad es obligatorio'); return; }
    const estadosConTecnico = ['agendado_con_tecnico', 'visita_fallida', 'completada'];
    if (m.tecnico_id && !estadosConTecnico.includes(m.estado)) {
      this.error.set('Para asignar técnico, el estado debe ser "Agendado con técnico", "Visita fallida" o "Completada".');
      return;
    }
    const fe = this.fechaError();
    if (fe) { this.error.set(fe); return; }
    if (this.modoDuracion() && m.fecha_inicio) {
      const end = new Date(new Date(m.fecha_inicio).getTime() + this.duracionMin() * 60000);
      m.fecha_fin = end.toISOString();
    }
    this.saving.set(true); this.error.set(null);
    try {
      if (this.isNew) {
        const created = await this.svc.create(m);
        if (this.embed) this.guardado.emit();
        else this.router.navigate(['/actividades', created.id]);
      } else {
        await this.svc.update(m.id!, m);
        if (this.embed) this.guardado.emit();
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al guardar');
    } finally {
      this.saving.set(false);
    }
  }

  cancel() { this.cancelado.emit(); }

  async remove() {
    const m = this.model(); if (!m?.id) return;
    if (!confirm('¿Eliminar actividad?')) return;
    await this.svc.remove(m.id);
    if (this.embed) this.guardado.emit();
    else this.router.navigate(['/actividades']);
  }

  async clone() {
    const m = this.model(); if (!m?.id) return;
    const created = await this.svc.clone(m.id);
    if (this.embed) this.guardado.emit();
    else this.router.navigate(['/actividades', created.id]);
  }
}
