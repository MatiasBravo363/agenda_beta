import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TiposVisitaService } from '../../core/services/tipos-visita.service';
import { TipoVisita } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-tipos-visita',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Tipos de visita" subtitle="Catálogo de tipos utilizados al programar una visita.">
      <button class="btn-primary" (click)="openNew()">+ Nuevo tipo</button>
    </app-page-header>

    <div class="p-8 space-y-4">
      @if (editing()) {
        <div class="card p-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Nombre</label>
              <input class="input" [(ngModel)]="editing()!.nombre"/>
            </div>
            <div>
              <label class="label">Descripción</label>
              <input class="input" [(ngModel)]="editing()!.descripcion"/>
            </div>
          </div>
          <div class="flex gap-2 mt-4 justify-end">
            <button class="btn-secondary" (click)="editing.set(null)">Cancelar</button>
            <button class="btn-primary" (click)="save()">Guardar</button>
          </div>
        </div>
      }

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr><th class="text-left px-4 py-3">Nombre</th><th class="text-left px-4 py-3">Descripción</th><th class="w-32"></th></tr>
          </thead>
          <tbody>
            @for (t of items(); track t.id) {
              <tr class="border-t border-slate-100">
                <td class="px-4 py-3 font-medium">{{ t.nombre }}</td>
                <td class="px-4 py-3 text-slate-600">{{ t.descripcion }}</td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button class="text-brand-600 hover:underline" (click)="edit(t)">Editar</button>
                  <button class="text-red-600 hover:underline" (click)="remove(t)">Eliminar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="px-4 py-8 text-center text-slate-400">Sin registros</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class TiposVisitaComponent implements OnInit {
  private svc = inject(TiposVisitaService);
  items = signal<TipoVisita[]>([]);
  editing = signal<Partial<TipoVisita> | null>(null);

  async ngOnInit() { await this.reload(); }
  async reload() { this.items.set(await this.svc.list()); }

  openNew() { this.editing.set({ nombre: '', descripcion: '' }); }
  edit(t: TipoVisita) { this.editing.set({ ...t }); }

  async save() {
    const v = this.editing();
    if (!v || !v.nombre) return;
    if (v.id) await this.svc.update(v.id, v);
    else await this.svc.create({ nombre: v.nombre!, descripcion: v.descripcion ?? null });
    this.editing.set(null);
    await this.reload();
  }

  async remove(t: TipoVisita) {
    if (!confirm(`¿Eliminar tipo "${t.nombre}"?`)) return;
    await this.svc.remove(t.id);
    await this.reload();
  }
}
