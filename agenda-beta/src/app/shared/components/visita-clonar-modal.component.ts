import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Visita } from '../../core/models';

@Component({
  selector: 'app-visita-clonar-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
         (click)="onBackdrop()">
      <div class="card w-full max-w-md p-6 space-y-4" (click)="$event.stopPropagation()">
        <div>
          <h3 class="font-semibold text-slate-800 dark:text-slate-100">Clonar visita</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cliente: <strong>{{ visita.nombre_cliente }}</strong>
          </p>
          <p class="text-xs text-slate-400 mt-1">
            Se conservan técnicos, actividades, estado, ubicación y descripción del original.
          </p>
        </div>

        @if (esEnCola) {
          <div class="rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <p class="text-sm text-slate-600 dark:text-slate-300">
              Esta visita está en cola. El clon también quedará <strong>en cola</strong>, sin horario asignado.
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Podés agendarlo después editando la visita o arrastrándola al calendario.
            </p>
          </div>
        } @else {
          <div>
            <label class="label">Fecha y hora de inicio *</label>
            <input class="input" type="datetime-local" [(ngModel)]="fechaInicio" name="fi"/>
          </div>
          <div>
            <label class="label">Fecha y hora de fin *</label>
            <input class="input" type="datetime-local" [(ngModel)]="fechaFin" name="ff"/>
          </div>
        }

        @if (error()) {
          <p class="text-xs text-red-600">{{ error() }}</p>
        }

        <div class="flex gap-2 justify-end pt-2">
          <button class="btn-secondary" (click)="cancelar.emit()" [disabled]="clonando()">Cancelar</button>
          <button class="btn-primary" (click)="confirmar()" [disabled]="clonando()">
            {{ clonando() ? 'Clonando…' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class VisitaClonarModalComponent implements OnInit {
  @Input({ required: true }) visita!: Visita;
  @Output() cancelar = new EventEmitter<void>();
  @Output() confirmado = new EventEmitter<{ fecha_inicio: string | null; fecha_fin: string | null }>();

  fechaInicio = '';
  fechaFin = '';
  clonando = signal(false);
  error = signal<string | null>(null);

  get esEnCola(): boolean {
    return this.visita.estado === 'en_cola';
  }

  ngOnInit() {
    if (this.esEnCola) return;

    // Redondeo al próximo bloque de 30 min
    const now = new Date();
    const minutos = now.getMinutes();
    const bloque = minutos < 30 ? 30 : 60;
    now.setMinutes(bloque, 0, 0);

    const duracionMs =
      this.visita.fecha_inicio && this.visita.fecha_fin
        ? new Date(this.visita.fecha_fin).getTime() - new Date(this.visita.fecha_inicio).getTime()
        : 60 * 60 * 1000;
    const fin = new Date(now.getTime() + duracionMs);

    this.fechaInicio = this.toLocal(now.toISOString());
    this.fechaFin = this.toLocal(fin.toISOString());
  }

  confirmar() {
    this.error.set(null);

    if (this.esEnCola) {
      this.clonando.set(true);
      this.confirmado.emit({ fecha_inicio: null, fecha_fin: null });
      return;
    }

    if (!this.fechaInicio || !this.fechaFin) {
      this.error.set('Ambas fechas son obligatorias.');
      return;
    }
    const inicioISO = this.fromLocal(this.fechaInicio);
    const finISO = this.fromLocal(this.fechaFin);
    if (!inicioISO || !finISO) {
      this.error.set('Fechas inválidas.');
      return;
    }
    if (new Date(finISO) <= new Date(inicioISO)) {
      this.error.set('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }
    this.clonando.set(true);
    this.confirmado.emit({ fecha_inicio: inicioISO, fecha_fin: finISO });
  }

  onBackdrop() {
    if (!this.clonando()) this.cancelar.emit();
  }

  private toLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private fromLocal(v: string): string | null {
    return v ? new Date(v).toISOString() : null;
  }
}
