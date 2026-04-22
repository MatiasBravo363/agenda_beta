import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TiposUsuarioService } from '../../core/services/tipos-usuario.service';
import { Permiso, TipoUsuario } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { mensajeGenericoDeError } from '../../core/services/service-error.util';

interface EditingTipo {
  id?: string;
  nombre: string;
  descripcion: string;
  permisoIds: Set<string>;
}

@Component({
  selector: 'app-tipos-usuario',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Tipos de usuario" subtitle="Define roles y los permisos asociados a cada uno.">
    </app-page-header>

    <div class="p-8 space-y-4">
      <div class="flex items-center gap-3">
        <button class="btn-primary ml-auto" (click)="abrirNuevo()">Nuevo tipo</button>
      </div>

      @if (feedback(); as f) {
        <div class="text-sm rounded-md px-3 py-2"
             [class.bg-green-50]="f.type === 'ok'" [class.text-green-700]="f.type === 'ok'"
             [class.bg-red-50]="f.type === 'err'" [class.text-red-700]="f.type === 'err'">
          {{ f.msg }}
        </div>
      }

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase">
            <tr>
              <th class="text-left px-4 py-3">Nombre</th>
              <th class="text-left px-4 py-3">Descripción</th>
              <th class="text-left px-4 py-3">Permisos</th>
              <th class="text-left px-4 py-3">Usuarios</th>
              <th class="w-40"></th>
            </tr>
          </thead>
          <tbody>
            @for (t of tipos(); track t.id) {
              <tr class="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="px-4 py-2.5 font-medium">{{ t.nombre }}</td>
                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">{{ t.descripcion || '—' }}</td>
                <td class="px-4 py-2.5">{{ t.permisos_count ?? 0 }}</td>
                <td class="px-4 py-2.5">{{ t.usuarios_count ?? 0 }}</td>
                <td class="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                  <button class="text-brand-600 hover:underline" (click)="abrirEditar(t)">Editar</button>
                  @if (t.nombre !== 'super_admin') {
                    <button class="text-red-600 hover:underline" (click)="remove(t)">Borrar</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Sin tipos definidos</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (editando(); as e) {
      <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-start justify-center p-4 overflow-auto" (click)="cerrar()">
        <div class="card p-6 w-full max-w-2xl mt-8 space-y-4" (click)="$event.stopPropagation()">
          <h3 class="font-semibold text-slate-800 dark:text-slate-100">
            {{ e.id ? 'Editar tipo' : 'Nuevo tipo' }}
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Nombre</label>
              <input class="input" [(ngModel)]="e.nombre" [disabled]="e.nombre === 'super_admin'"/>
            </div>
            <div>
              <label class="label">Descripción</label>
              <input class="input" [(ngModel)]="e.descripcion"/>
            </div>
          </div>

          <div class="space-y-3">
            <div class="text-sm font-semibold text-slate-700 dark:text-slate-200">Permisos asignados</div>
            @for (cat of categorias(); track cat.nombre) {
              <div class="rounded-md border border-slate-200 dark:border-slate-700 p-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                  {{ cat.nombre }}
                </div>
                <div class="grid grid-cols-2 gap-2">
                  @for (p of cat.permisos; track p.id) {
                    <label class="flex items-center gap-2 text-sm">
                      <input type="checkbox" [checked]="e.permisoIds.has(p.id)" (change)="togglePermiso(p, $event)"/>
                      <span>{{ p.descripcion }}</span>
                      <span class="text-[10px] font-mono text-slate-400">{{ p.codigo }}</span>
                    </label>
                  }
                </div>
              </div>
            }
          </div>

          <div class="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button class="btn-secondary" (click)="cerrar()" [disabled]="guardando()">Cancelar</button>
            <button class="btn-primary" (click)="guardar()" [disabled]="guardando()">
              {{ guardando() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TiposUsuarioComponent implements OnInit {
  private svc = inject(TiposUsuarioService);

  tipos = signal<TipoUsuario[]>([]);
  permisos = signal<Permiso[]>([]);
  editando = signal<EditingTipo | null>(null);
  guardando = signal(false);
  feedback = signal<{ type: 'ok' | 'err'; msg: string } | null>(null);

  categorias = computed(() => {
    const map = new Map<string, Permiso[]>();
    for (const p of this.permisos()) {
      const arr = map.get(p.categoria) ?? [];
      arr.push(p);
      map.set(p.categoria, arr);
    }
    return Array.from(map.entries()).map(([nombre, permisos]) => ({ nombre, permisos }));
  });

  async ngOnInit() {
    await this.reload();
    this.permisos.set(await this.svc.listPermisos());
  }

  async reload() {
    try {
      this.tipos.set(await this.svc.listConConteos());
    } catch (e: any) {
      this.flash('err', mensajeGenericoDeError(e, 'No se pudieron cargar los tipos.'));
    }
  }

  abrirNuevo() {
    this.editando.set({ nombre: '', descripcion: '', permisoIds: new Set() });
  }

  async abrirEditar(t: TipoUsuario) {
    try {
      const permisoIds = await this.svc.permisosDeTipo(t.id);
      this.editando.set({
        id: t.id,
        nombre: t.nombre,
        descripcion: t.descripcion ?? '',
        permisoIds: new Set(permisoIds),
      });
    } catch (e: any) {
      this.flash('err', mensajeGenericoDeError(e, 'No se pudo cargar el tipo.'));
    }
  }

  togglePermiso(p: Permiso, ev: Event) {
    const e = this.editando();
    if (!e) return;
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) e.permisoIds.add(p.id);
    else e.permisoIds.delete(p.id);
  }

  async guardar() {
    const e = this.editando();
    if (!e) return;
    if (!e.nombre.trim()) {
      this.flash('err', 'El nombre es obligatorio.');
      return;
    }
    this.guardando.set(true);
    try {
      let id = e.id;
      if (id) {
        await this.svc.update(id, { nombre: e.nombre.trim(), descripcion: e.descripcion || null });
      } else {
        const created = await this.svc.create({ nombre: e.nombre.trim(), descripcion: e.descripcion || null });
        id = created.id;
      }
      await this.svc.setPermisos(id, Array.from(e.permisoIds));
      this.editando.set(null);
      await this.reload();
      this.flash('ok', 'Tipo guardado.');
    } catch (err: any) {
      this.flash('err', mensajeGenericoDeError(err, 'No se pudo guardar.'));
    } finally {
      this.guardando.set(false);
    }
  }

  async remove(t: TipoUsuario) {
    if (t.nombre === 'super_admin') return;
    if ((t.usuarios_count ?? 0) > 0) {
      this.flash('err', 'No se puede borrar un tipo que tiene usuarios asignados.');
      return;
    }
    if (!confirm(`¿Eliminar el tipo "${t.nombre}"?`)) return;
    try {
      await this.svc.remove(t.id);
      await this.reload();
      this.flash('ok', 'Tipo eliminado.');
    } catch (e: any) {
      this.flash('err', mensajeGenericoDeError(e, 'No se pudo eliminar.'));
    }
  }

  cerrar() { this.editando.set(null); }

  private flash(type: 'ok' | 'err', msg: string) {
    this.feedback.set({ type, msg });
    setTimeout(() => this.feedback.set(null), 4000);
  }
}
