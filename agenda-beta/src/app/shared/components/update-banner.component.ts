import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { VersionCheckService } from '../../core/services/version-check.service';

const COUNTDOWN_INICIAL = 30;

/**
 * Banner top-fixed que aparece cuando VersionCheckService detecta que el
 * server tiene una versión nueva. Cuenta regresiva 30s y dispara reload
 * automático (también botón "Actualizar ahora").
 */
@Component({
  selector: 'app-update-banner',
  standalone: true,
  template: `
    @if (visible()) {
      <div
        role="status"
        class="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-white shadow-md flex items-center justify-between gap-3 px-4 py-2 text-sm"
      >
        <div class="flex items-center gap-2">
          <span aria-hidden="true">⚡</span>
          <span>
            Hay una versión nueva de Agenda_BETA disponible.
            @if (countdown() > 0) {
              <span class="font-mono"> Recargando en {{ countdown() }}s.</span>
            } @else {
              <span> Recargando…</span>
            }
          </span>
        </div>
        <button
          type="button"
          class="bg-white text-amber-700 hover:bg-amber-50 font-medium px-3 py-1 rounded text-xs"
          (click)="recargarAhora()"
        >
          Actualizar ahora
        </button>
      </div>
    }
  `,
})
export class UpdateBannerComponent implements OnInit, OnDestroy {
  private vc = inject(VersionCheckService);

  countdown = signal(COUNTDOWN_INICIAL);
  visible = computed(() => this.vc.actualizacionDisponible());

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cuando se prende la flag, arrancamos el countdown.
    effect(() => {
      if (this.vc.actualizacionDisponible() && !this.timer) {
        this.startCountdown();
      }
    });
  }

  ngOnInit(): void {
    /* nada — la suscripción la maneja el effect del constructor. */
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  recargarAhora(): void {
    if (this.timer) clearInterval(this.timer);
    window.location.reload();
  }

  private startCountdown(): void {
    this.countdown.set(COUNTDOWN_INICIAL);
    this.timer = setInterval(() => {
      const next = this.countdown() - 1;
      this.countdown.set(next);
      if (next <= 0) {
        if (this.timer) clearInterval(this.timer);
        window.location.reload();
      }
    }, 1000);
  }
}
