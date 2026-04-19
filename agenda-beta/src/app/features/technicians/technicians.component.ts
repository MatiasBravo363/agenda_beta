import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TechniciansService } from '../../core/services/technicians.service';
import { Tecnico } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-technicians',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Técnicos" subtitle="Catálogo de técnicos internos y externos.">
      <button class="btn-primary" (click)="openNew()">+ Nuevo técnico</button>
    </app-page-header>

    <div class="p-8 space-y-4">
      @if (editing()) {
        <div class="card p-6">
          <div class="grid grid-cols-2 gap-4">
            <div><label class="label">Nombre</label><input class="input" [(ngModel)]="editing()!.nombre"/></div>
            <div><label class="label">Apellidos</label><input class="input" [(ngModel)]="editing()!.apellidos"/></div>
            <div><label class="label">RUT</label><input class="input" [(ngModel)]="editing()!.rut"/></div>
            <div>
              <label class="label">Tipo</label>
              <select class="input" [(ngModel)]="editing()!.tipo">
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
              </select>
            </div>
            <div>
              <label class="label">Región</label>
              <input class="input" [(ngModel)]="editing()!.region" placeholder="Santiago, Valparaíso, …"/>
            </div>
            <div class="flex items-end gap-4">
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [(ngModel)]="editing()!.tecnico_bermann"/>
                Técnico Bermann
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [(ngModel)]="editing()!.activo"/>
                Activo
              </label>
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
            <tr>
              <th class="text-left px-4 py-3">Nombre</th>
              <th class="text-left px-4 py-3">RUT</th>
              <th class="text-left px-4 py-3">Tipo</th>
              <th class="text-left px-4 py-3">Región</th>
              <th class="text-left px-4 py-3">Bermann</th>
              <th class="text-left px-4 py-3">Activo</th>
              <th class="w-32"></th>
            </tr>
          </thead>
          <tbody>
            @for (t of items(); track t.id) {
              <tr class="border-t border-slate-100">
                <td class="px-4 py-3 font-medium">{{ t.nombre }} {{ t.apellidos }}</td>
                <td class="px-4 py-3">{{ t.rut }}</td>
                <td class="px-4 py-3 capitalize">{{ t.tipo }}</td>
                <td class="px-4 py-3">{{ t.region || '-' }}</td>
                <td class="px-4 py-3">{{ t.tecnico_bermann ? 'Sí' : 'No' }}</td>
                <td class="px-4 py-3">{{ t.activo ? 'Sí' : 'No' }}</td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button class="text-brand-600 hover:underline" (click)="edit(t)">Editar</button>
                  <button class="text-red-600 hover:underline" (click)="remove(t)">Eliminar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Sin registros</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class TechniciansComponent implements OnInit {
  private svc = inject(TechniciansService);
  items = signal<Tecnico[]>([]);
  editing = signal<Partial<Tecnico> | null>(null);

  async ngOnInit() { await this.reload(); }
  async reload() { this.items.set(await this.svc.list()); }

  openNew() {
    this.editing.set({ nombre: '', apellidos: '', rut: '', tipo: 'interno', tecnico_bermann: false, region: '', activo: true });
  }
  edit(t: Tecnico) { this.editing.set({ ...t }); }

  async save() {
    const v = this.editing();
    if (!v?.nombre || !v?.apellidos || !v?.rut) return;
    if (v.id) await this.svc.update(v.id, v);
    else await this.svc.create({
      nombre: v.nombre!, apellidos: v.apellidos!, rut: v.rut!,
      tipo: v.tipo ?? 'interno', tecnico_bermann: !!v.tecnico_bermann,
      region: v.region ?? null, activo: v.activo ?? true,
    });
    this.editing.set(null);
    await this.reload();
  }

  async remove(t: Tecnico) {
    if (!confirm(`¿Eliminar técnico "${t.nombre} ${t.apellidos}"?`)) return;
    await this.svc.remove(t.id);
    await this.reload();
  }
}
