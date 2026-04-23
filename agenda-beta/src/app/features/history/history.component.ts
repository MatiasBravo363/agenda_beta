import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HistoryService } from '../../core/services/history.service';
import { VisitaHistorial } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

type SortKey = 'id' | 'usuario' | 'cliente' | 'visita' | 'tecnico' | 'tipo';
type SortDir = 'asc' | 'desc';

interface Row {
  id: string;
  idShort: string;
  visitaId: string | null;
  usuario: string;
  cliente: string;
  visita: string;
  tecnico: string;
  tipo: string;
  raw: VisitaHistorial;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent],
  template: `
    <app-page-header title="Historial de visitas" subtitle="Cambios de estado de cada visita con usuario y fecha."></app-page-header>

    <div class="p-8 space-y-4">
      <div class="card p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label class="label">Usuario</label>
            <select class="input" [ngModel]="fUsuario()" (ngModelChange)="fUsuario.set($event)">
              <option [ngValue]="''">Todos</option>
              @for (v of opts().usuarios; track v) { <option [ngValue]="v">{{ v }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Cliente</label>
            <select class="input" [ngModel]="fCliente()" (ngModelChange)="fCliente.set($event)">
              <option [ngValue]="''">Todos</option>
              @for (v of opts().clientes; track v) { <option [ngValue]="v">{{ v }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Visita</label>
            <select class="input" [ngModel]="fVisita()" (ngModelChange)="fVisita.set($event)">
              <option [ngValue]="''">Todas</option>
              @for (v of opts().visitas; track v) { <option [ngValue]="v">{{ v }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Técnico</label>
            <select class="input" [ngModel]="fTecnico()" (ngModelChange)="fTecnico.set($event)">
              <option [ngValue]="''">Todos</option>
              @for (v of opts().tecnicos; track v) { <option [ngValue]="v">{{ v }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Actividad</label>
            <select class="input" [ngModel]="fTipo()" (ngModelChange)="fTipo.set($event)">
              <option [ngValue]="''">Todos</option>
              @for (v of opts().tipos; track v) { <option [ngValue]="v">{{ v }}</option> }
            </select>
          </div>
        </div>
        <div class="flex justify-end mt-3">
          <button class="btn-secondary" (click)="clearFilters()">Limpiar filtros</button>
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('id')">ID {{ arrow('id') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('usuario')">Usuario creador {{ arrow('usuario') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('cliente')">Cliente {{ arrow('cliente') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('visita')">Visita {{ arrow('visita') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('tecnico')">Técnico {{ arrow('tecnico') }}</th>
              <th class="text-left px-4 py-3 cursor-pointer select-none" (click)="toggleSort('tipo')">Actividad {{ arrow('tipo') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (r of filtered(); track r.id) {
              <tr class="border-t border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-2.5 font-mono text-xs text-slate-500" [title]="r.id">{{ r.idShort }}</td>
                <td class="px-4 py-2.5">{{ r.usuario }}</td>
                <td class="px-4 py-2.5">{{ r.cliente }}</td>
                <td class="px-4 py-2.5">
                  @if (r.visitaId) {
                    <a class="text-brand-600 hover:underline" [routerLink]="['/visitas', r.visitaId]">{{ r.visita }}</a>
                  } @else { {{ r.visita }} }
                </td>
                <td class="px-4 py-2.5">{{ r.tecnico }}</td>
                <td class="px-4 py-2.5">{{ r.tipo }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="px-4 py-10 text-center text-slate-400">Sin registros</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class HistoryComponent implements OnInit {
  private svc = inject(HistoryService);
  rows = signal<Row[]>([]);

  fUsuario = signal('');
  fCliente = signal('');
  fVisita = signal('');
  fTecnico = signal('');
  fTipo = signal('');

  sortKey = signal<SortKey>('id');
  sortDir = signal<SortDir>('desc');

  opts = computed(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr.filter((x) => x && x !== '—'))).sort();
    const all = this.rows();
    return {
      usuarios: uniq(all.map((r) => r.usuario)),
      clientes: uniq(all.map((r) => r.cliente)),
      visitas: uniq(all.map((r) => r.visita)),
      tecnicos: uniq(all.map((r) => r.tecnico)),
      tipos: uniq(all.map((r) => r.tipo)),
    };
  });

  filtered = computed<Row[]>(() => {
    const u = this.fUsuario(), c = this.fCliente(), a = this.fVisita(), t = this.fTecnico(), tp = this.fTipo();
    const key = this.sortKey(), mult = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.rows()]
      .filter((r) =>
        (!u || r.usuario === u) &&
        (!c || r.cliente === c) &&
        (!a || r.visita === a) &&
        (!t || r.tecnico === t) &&
        (!tp || r.tipo === tp)
      )
      .sort((x, y) => {
        const av = (x[key] ?? '') as string;
        const bv = (y[key] ?? '') as string;
        if (av < bv) return -1 * mult;
        if (av > bv) return 1 * mult;
        return 0;
      });
  });

  async ngOnInit() {
    const data = await this.svc.list();
    this.rows.set(data.map((h) => this.toRow(h)));
  }

  private toRow(h: VisitaHistorial): Row {
    const v = h.visita;
    const tec = v?.tecnico ? `${v.tecnico.nombre} ${v.tecnico.apellidos}` : '—';
    const tipo = v?.actividad?.nombre ?? '—';
    return {
      id: h.id,
      idShort: h.id.slice(0, 8),
      visitaId: v?.id ?? null,
      usuario: h.usuario ? `${h.usuario.nombre} ${h.usuario.apellido}` : '—',
      cliente: v?.nombre_cliente ?? '—',
      visita: v ? `#${v.id.slice(0, 8)}` : '—',
      tecnico: tec,
      tipo,
      raw: h,
    };
  }

  toggleSort(k: SortKey) {
    if (this.sortKey() === k) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(k);
      this.sortDir.set('asc');
    }
  }

  arrow(k: SortKey) {
    if (this.sortKey() !== k) return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  clearFilters() {
    this.fUsuario.set(''); this.fCliente.set(''); this.fVisita.set('');
    this.fTecnico.set(''); this.fTipo.set('');
  }
}
