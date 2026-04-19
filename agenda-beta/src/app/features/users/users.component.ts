import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { Usuario } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

type SortKey = 'nombre' | 'email' | 'created_at';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Usuarios" subtitle="Usuarios internos que operan el sistema.">
    </app-page-header>

    <div class="p-8 space-y-4">
      <div class="flex items-center gap-3">
        <input
          class="input flex-1 max-w-md"
          type="text"
          placeholder="Buscar por nombre, apellido o email…"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
        />
        <button class="btn-primary ml-auto" (click)="startInvite()">Invitar usuario</button>
      </div>

      @if (creating()) {
        <div class="card p-6 space-y-4">
          <h3 class="font-semibold">Invitar nuevo usuario</h3>
          <div class="grid grid-cols-3 gap-4">
            <div><label class="label">Email</label><input class="input" type="email" [(ngModel)]="creating()!.email"/></div>
            <div><label class="label">Nombre</label><input class="input" [(ngModel)]="creating()!.nombre"/></div>
            <div><label class="label">Apellido</label><input class="input" [(ngModel)]="creating()!.apellido"/></div>
          </div>
          <p class="text-xs text-slate-500">
            Se enviará un enlace de acceso al email. El perfil aparecerá cuando la persona confirme su acceso.
          </p>
          <div class="flex gap-2 justify-end">
            <button class="btn-secondary" (click)="creating.set(null)" [disabled]="sending()">Cancelar</button>
            <button class="btn-primary" (click)="sendInvite()" [disabled]="sending()">
              {{ sending() ? 'Enviando…' : 'Enviar invitación' }}
            </button>
          </div>
        </div>
      }

      @if (editing()) {
        <div class="card p-6">
          <div class="grid grid-cols-2 gap-4">
            <div><label class="label">Nombre</label><input class="input" [(ngModel)]="editing()!.nombre"/></div>
            <div><label class="label">Apellido</label><input class="input" [(ngModel)]="editing()!.apellido"/></div>
            <div class="col-span-2"><label class="label">Email</label>
              <input class="input bg-slate-50" [value]="editing()!.email || ''" disabled/>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 mt-4 justify-between items-center">
            <button class="btn-secondary" (click)="sendReset()" [disabled]="resetting() || !editing()!.email">
              {{ resetting() ? 'Enviando…' : 'Enviar link de reset de contraseña' }}
            </button>
            <div class="flex gap-2">
              <button class="btn-secondary" (click)="editing.set(null)">Cancelar</button>
              <button class="btn-primary" (click)="save()">Guardar</button>
            </div>
          </div>
          <p class="text-xs text-slate-500 mt-2">
            Las contraseñas no son visibles (están cifradas). Enviá un link de reset para que el usuario defina una nueva.
          </p>
        </div>
      }

      @if (feedback(); as f) {
        <div class="text-sm rounded-md px-3 py-2"
             [class.bg-green-50]="f.type === 'ok'"
             [class.text-green-700]="f.type === 'ok'"
             [class.bg-red-50]="f.type === 'err'"
             [class.text-red-700]="f.type === 'err'">
          {{ f.msg }}
        </div>
      }

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('nombre')">
                Nombre {{ sortArrow('nombre') }}
              </th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('email')">
                Email {{ sortArrow('email') }}
              </th>
              <th class="text-left px-4 py-3">Estado</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('created_at')">
                Creado {{ sortArrow('created_at') }}
              </th>
              <th class="w-32"></th>
            </tr>
          </thead>
          <tbody>
            @for (u of filtered(); track u.id) {
              <tr class="border-t border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-2.5 font-medium">{{ u.nombre }} {{ u.apellido }}</td>
                <td class="px-4 py-2.5 text-slate-600">{{ u.email }}</td>
                <td class="px-4 py-2.5">
                  <button
                    class="chip cursor-pointer"
                    [class.bg-green-100]="u.activo"
                    [class.text-green-700]="u.activo"
                    [class.bg-slate-200]="!u.activo"
                    [class.text-slate-600]="!u.activo"
                    (click)="toggleActivo(u)"
                    title="Click para alternar"
                  >
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </button>
                </td>
                <td class="px-4 py-2.5 text-slate-600">{{ formatDate(u.created_at) }}</td>
                <td class="px-4 py-2.5 text-right">
                  <button class="text-brand-600 hover:underline" (click)="edit(u)">Editar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Sin registros</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class UsersComponent implements OnInit {
  private svc = inject(UsersService);

  items = signal<Usuario[]>([]);
  editing = signal<Partial<Usuario> | null>(null);
  creating = signal<{ email: string; nombre: string; apellido: string } | null>(null);
  sending = signal(false);
  resetting = signal(false);
  query = signal('');
  sortKey = signal<SortKey>('nombre');
  sortDir = signal<SortDir>('asc');
  feedback = signal<{ type: 'ok' | 'err'; msg: string } | null>(null);

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const key = this.sortKey();
    const dir = this.sortDir();
    const mult = dir === 'asc' ? 1 : -1;

    const matches = (u: Usuario) => {
      if (!q) return true;
      const hay = `${u.nombre ?? ''} ${u.apellido ?? ''} ${u.email ?? ''}`.toLowerCase();
      return hay.includes(q);
    };

    const cmp = (a: Usuario, b: Usuario) => {
      const av = (a[key] ?? '') as string;
      const bv = (b[key] ?? '') as string;
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return 0;
    };

    return [...this.items()].filter(matches).sort(cmp);
  });

  async ngOnInit() { await this.reload(); }
  async reload() { this.items.set(await this.svc.list()); }

  toggleSort(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  sortArrow(key: SortKey): string {
    if (this.sortKey() !== key) return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  edit(u: Usuario) { this.editing.set({ ...u }); }

  async save() {
    const v = this.editing();
    if (!v?.id) return;
    try {
      await this.svc.update(v.id, { nombre: v.nombre, apellido: v.apellido });
      this.editing.set(null);
      await this.reload();
      this.flash('ok', 'Usuario actualizado.');
    } catch (e: any) {
      this.flash('err', e?.message ?? 'Error al guardar.');
    }
  }

  async sendReset() {
    const email = this.editing()?.email;
    if (!email) return;
    this.resetting.set(true);
    try {
      await this.svc.sendPasswordReset(email);
      this.flash('ok', `Link de reset enviado a ${email}.`);
    } catch (e: any) {
      this.flash('err', e?.message ?? 'No se pudo enviar el reset.');
    } finally {
      this.resetting.set(false);
    }
  }

  async toggleActivo(u: Usuario) {
    try {
      await this.svc.setActivo(u.id, !u.activo);
      await this.reload();
    } catch (e: any) {
      this.flash('err', e?.message ?? 'No se pudo cambiar el estado.');
    }
  }

  startInvite() {
    this.creating.set({ email: '', nombre: '', apellido: '' });
  }

  async sendInvite() {
    const v = this.creating();
    if (!v) return;
    if (!v.email || !v.nombre || !v.apellido) {
      this.flash('err', 'Email, nombre y apellido son obligatorios.');
      return;
    }
    this.sending.set(true);
    try {
      await this.svc.invite(v.email, v.nombre, v.apellido);
      this.flash('ok', `Invitación enviada a ${v.email}.`);
      this.creating.set(null);
      await this.reload();
    } catch (e: any) {
      this.flash('err', e?.message ?? 'No se pudo enviar la invitación.');
    } finally {
      this.sending.set(false);
    }
  }

  private flash(type: 'ok' | 'err', msg: string) {
    this.feedback.set({ type, msg });
    setTimeout(() => this.feedback.set(null), 4000);
  }
}
