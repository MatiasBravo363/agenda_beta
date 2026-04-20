import { Component, inject } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Configuración" subtitle="Preferencias del sistema."></app-page-header>

    <div class="p-8 space-y-4">
      <div class="card p-6 flex items-center justify-between">
        <div>
          <div class="font-semibold text-slate-800 dark:text-slate-100">Modo oscuro</div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cambia la paleta de toda la aplicación a un esquema oscuro. Se guarda en este navegador.
          </p>
        </div>
        <button
          type="button"
          class="relative inline-flex h-7 w-14 items-center rounded-full transition-colors"
          [class.bg-brand-600]="theme.isDark()"
          [class.bg-slate-300]="!theme.isDark()"
          (click)="theme.toggle()"
          [attr.aria-pressed]="theme.isDark()"
        >
          <span
            class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
            [class.translate-x-8]="theme.isDark()"
            [class.translate-x-1]="!theme.isDark()"
          ></span>
        </button>
      </div>
    </div>
  `,
})
export class ConfiguracionComponent {
  theme = inject(ThemeService);
}
