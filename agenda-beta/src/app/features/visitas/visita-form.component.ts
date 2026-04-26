import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConflictoVisitaError, VisitasService } from '../../core/services/visitas.service';
import { TechniciansService } from '../../core/services/technicians.service';
import { ActividadesService } from '../../core/services/actividades.service';
import { Actividad, Tecnico, Visita } from '../../core/models';
import { ESTADO_LABEL, ESTADOS, colorDeVisita } from '../../core/utils/estado.util';
import { DireccionAutocompleteComponent, DireccionSeleccionada } from '../../shared/components/direccion-autocomplete.component';
import { MultiSelectComponent, MultiSelectOption } from '../../shared/components/multi-select.component';
import { VisitaClonarModalComponent } from '../../shared/components/visita-clonar-modal.component';
import { SiTieneDirective } from '../../shared/directives/si-tiene.directive';

@Component({
  selector: 'app-visita-form',
  standalone: true,
  imports: [FormsModule, RouterLink, DireccionAutocompleteComponent, MultiSelectComponent, VisitaClonarModalComponent, SiTieneDirective],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      @if (!embed) {
        <a routerLink="/visitas" class="text-sm text-slate-500 hover:text-slate-700">← Volver a visitas</a>
      }

      @if (model()) {
        <div class="card p-6 space-y-6">
          <div class="flex items-center gap-3">
            <span class="inline-block w-3.5 h-3.5 rounded-full" [style.background]="color()"></span>
            <div class="text-xl font-bold">{{ isNew ? 'Nueva visita' : model()!.nombre_cliente }}</div>
            <span class="chip bg-slate-100 text-slate-700 ml-auto">{{ estadoLabel() }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
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
              <label class="label">Actividades *</label>
              <app-multi-select
                [options]="actividadesOptions()"
                [selected]="actividadesIds()"
                (selectedChange)="actividadesIds.set($event)"
                placeholder="— Seleccionar una o más —">
              </app-multi-select>
            </div>

            <div>
              <label class="label">Técnicos asignados</label>
              <app-multi-select
                [options]="tecnicosOptions()"
                [selected]="tecnicosIds()"
                (selectedChange)="tecnicosIds.set($event)"
                placeholder="— Sin asignar —">
              </app-multi-select>
            </div>

            <div>
              <label class="label">Ubicación</label>
              <app-direccion-autocomplete
                [value]="model()!.ubicacion || ''"
                (valueChange)="model()!.ubicacion = $event"
                (selected)="onDireccionSeleccionada($event)"
              ></app-direccion-autocomplete>
            </div>

            <div class="md:col-span-2 rounded-md border border-slate-200 p-4 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-slate-700">Programación</h4>
                <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" [checked]="modoDuracion()" (change)="toggleModoDuracion($event)"/>
                  Usar duración (calcula fecha fin)
                </label>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div class="md:col-span-2">
              <label class="label">Descripción</label>
              <textarea class="input min-h-[220px] resize-y" [(ngModel)]="model()!.descripcion" name="descripcion"></textarea>
            </div>
          </div>

          @if (error()) { <div class="text-sm text-red-600">{{ error() }}</div> }

          <div class="flex gap-2 justify-end pt-4 border-t border-slate-100">
            @if (!isNew) {
              <button class="btn-secondary" (click)="clone()">Clonar</button>
              <button *appSiTiene="'visitas.borrar'" class="btn-danger" (click)="remove()">Eliminar</button>
            }
            @if (embed) {
              <button class="btn-secondary" (click)="cancel()">Cancelar</button>
            } @else {
              <button class="btn-secondary" routerLink="/visitas">Cancelar</button>
            }
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      }
    </div>

    @if (clonando(); as v) {
      <app-visita-clonar-modal
        [visita]="v"
        (cancelar)="clonando.set(null)"
        (confirmado)="onClonarConfirmado($event)">
      </app-visita-clonar-modal>
    }
  `,
})
export class VisitaFormComponent implements OnInit {
  private svc = inject(VisitasService);
  private techSvc = inject(TechniciansService);
  private typeSvc = inject(ActividadesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @Input() idEmbed?: string;
  @Output() guardado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  get embed(): boolean { return !!this.idEmbed; }

  model = signal<Partial<Visita> | null>(null);
  tecnicos = signal<Tecnico[]>([]);
  actividades = signal<Actividad[]>([]);
  tecnicosIds = signal<string[]>([]);
  actividadesIds = signal<string[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);
  modoDuracion = signal(false);
  duracionMin = signal(60);
  clonando = signal<Visita | null>(null);
  isNew = true;

  tecnicosOptions = computed<MultiSelectOption[]>(() =>
    this.tecnicos().map((t) => ({
      id: t.id,
      label: `${t.nombre} ${t.apellidos} · ${t.tecnico_bermann ? 'Bermann' : t.tipo} · ${t.region || '—'}`,
    })),
  );
  actividadesOptions = computed<MultiSelectOption[]>(() =>
    this.actividades().map((t) => ({ id: t.id, label: t.nombre })),
  );

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
    this.actividades.set(tp);

    const id = this.idEmbed ?? this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nueva') {
      this.isNew = false;
      const a = await this.svc.getById(id);
      if (a && a.estado !== 'en_cola' && a.fecha_inicio) {
        // Visita agendada con fecha_fin faltante o inválida (<= inicio):
        // autocompletar con +60min para que el form abra sin errores y el
        // usuario pueda ajustar antes de guardar.
        const finValida = a.fecha_fin && new Date(a.fecha_fin) > new Date(a.fecha_inicio);
        if (!finValida) {
          a.fecha_fin = new Date(new Date(a.fecha_inicio).getTime() + 60 * 60000).toISOString();
        }
      }
      this.model.set(a ?? null);
      if (a) {
        const tIds = (a.tecnicos ?? []).map((x) => x.id);
        this.tecnicosIds.set(tIds.length ? tIds : a.tecnico_id ? [a.tecnico_id] : []);
        const actIds = (a.actividades ?? []).map((x) => x.id);
        this.actividadesIds.set(actIds.length ? actIds : a.actividad_id ? [a.actividad_id] : []);
      }
    } else {
      this.isNew = true;
      const qp = this.route.snapshot.queryParamMap;
      const start = qp.get('start');
      const end = qp.get('end');
      this.model.set({
        nombre_cliente: '',
        estado: 'en_cola',
        actividad_id: null,
        tecnico_id: null,
        fecha_inicio: start ?? null,
        fecha_fin: end ?? null,
        ubicacion: '',
        descripcion: '',
      });
      this.tecnicosIds.set([]);
      this.actividadesIds.set([]);
    }
  }

  estadoLabel() {
    const e = this.model()?.estado;
    return e ? ESTADO_LABEL[e] : '';
  }

  color() {
    const m = this.model();
    if (!m?.estado) return '#94a3b8';
    const principalId = this.tecnicosIds()[0] ?? null;
    const tec = principalId ? this.tecnicos().find((x) => x.id === principalId) ?? null : null;
    return colorDeVisita({ estado: m.estado }, tec);
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
    if (this.actividadesIds().length === 0) { this.error.set('Seleccioná al menos una actividad'); return; }
    const estadosConTecnico = ['agendado_con_tecnico', 'visita_fallida', 'completada'];
    if (this.tecnicosIds().length > 0 && !estadosConTecnico.includes(m.estado)) {
      this.error.set('Para asignar técnicos, el estado debe ser "Agendado con técnico", "Visita fallida" o "Completada".');
      return;
    }
    if (this.modoDuracion() && m.fecha_inicio) {
      const end = new Date(new Date(m.fecha_inicio).getTime() + this.duracionMin() * 60000);
      m.fecha_fin = end.toISOString();
    }
    if (m.estado !== 'en_cola' && (!m.fecha_inicio || !m.fecha_fin)) {
      this.error.set('Un bloque agendado debe tener fecha y hora de inicio y de fin. Si todavía no hay horario, dejá el estado en "En cola".');
      return;
    }
    const fe = this.fechaError();
    if (fe) { this.error.set(fe); return; }
    const payload: Partial<Visita> = {
      ...m,
      tecnicos_ids: this.tecnicosIds(),
      actividades_ids: this.actividadesIds(),
    };
    this.saving.set(true); this.error.set(null);
    try {
      if (this.isNew) {
        const created = await this.svc.create(payload);
        if (this.embed) this.guardado.emit();
        else this.router.navigate(['/visitas', created.id]);
      } else {
        await this.svc.update(m.id!, payload);
        if (this.embed) this.guardado.emit();
      }
    } catch (e: unknown) {
      if (e instanceof ConflictoVisitaError) {
        const reload = confirm(
          `${e.message}\n\n¿Recargar la versión actual de la visita? Vas a perder tus cambios sin guardar.`,
        );
        if (reload && m.id) {
          const fresh = await this.svc.getById(m.id);
          if (fresh) this.model.set(fresh);
          this.error.set('Recargado. Volvé a aplicar tus cambios.');
        } else {
          this.error.set('Edición cancelada por conflicto. Tu trabajo no se guardó.');
        }
      } else {
        const msg = (e as { message?: string })?.message;
        this.error.set(msg ?? 'Error al guardar');
      }
    } finally {
      this.saving.set(false);
    }
  }

  cancel() { this.cancelado.emit(); }

  async remove() {
    const m = this.model(); if (!m?.id) return;
    if (!confirm('¿Eliminar visita?')) return;
    await this.svc.remove(m.id);
    if (this.embed) this.guardado.emit();
    else this.router.navigate(['/visitas']);
  }

  async clone() {
    const m = this.model(); if (!m?.id) return;
    // Recupera la visita completa (con técnicos/actividades) para pasarle al modal.
    const original = await this.svc.getById(m.id);
    if (!original) return;
    this.clonando.set(original);
  }

  async onClonarConfirmado(ev: { fecha_inicio: string | null; fecha_fin: string | null }) {
    const v = this.clonando();
    if (!v) return;
    try {
      const created = await this.svc.clone(v.id, ev.fecha_inicio, ev.fecha_fin);
      this.clonando.set(null);
      if (this.embed) this.guardado.emit();
      else this.router.navigate(['/visitas', created.id]);
    } catch (e: unknown) {
      this.error.set((e as { message?: string })?.message ?? 'No se pudo clonar la visita');
      this.clonando.set(null);
    }
  }
}
