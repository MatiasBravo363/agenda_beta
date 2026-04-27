import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface MultiSelectOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="relative">
      <button
        type="button"
        class="input text-left flex flex-wrap gap-1 min-h-[42px] items-center cursor-pointer"
        [class.ring-2]="open()"
        [class.ring-brand-100]="open()"
        [class.border-brand-500]="open()"
        (click)="toggle()"
        [attr.aria-expanded]="open()">
        @if (selectedOptions().length === 0) {
          <span class="text-slate-400">{{ placeholder }}</span>
        } @else {
          @for (o of selectedOptions(); track o.id) {
            <span class="chip bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100">
              {{ o.label }}
              <button
                type="button"
                class="ml-1 text-brand-500 hover:text-brand-700"
                (click)="remove(o.id, $event)"
                [attr.aria-label]="'Quitar ' + o.label">×</button>
            </span>
          }
        }
        <span class="ml-auto text-slate-400 text-xs">▾</span>
      </button>

      @if (open()) {
        <div class="absolute z-20 mt-1 w-full card p-2 max-h-72 overflow-auto shadow-lg">
          @if (options.length > 6) {
            <input
              class="input mb-2"
              type="text"
              placeholder="Filtrar…"
              [(ngModel)]="filtro"
              (click)="$event.stopPropagation()"/>
          }
          @if (filteredOptions().length === 0) {
            <div class="text-xs text-slate-400 px-2 py-3 text-center">Sin opciones</div>
          } @else {
            @for (o of filteredOptions(); track o.id) {
              <label
                class="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  class="mt-0.5"
                  [checked]="isSelected(o.id)"
                  (change)="toggleOne(o.id)"
                  (click)="$event.stopPropagation()"/>
                <span class="flex-1 text-slate-700 dark:text-slate-200">{{ o.label }}</span>
              </label>
            }
          }
        </div>
      }
    </div>
  `,
})
export class MultiSelectComponent {
  @Input({ required: true }) options: MultiSelectOption[] = [];
  @Input() selected: string[] = [];
  @Input() placeholder = 'Seleccionar…';
  @Output() selectedChange = new EventEmitter<string[]>();

  open = signal(false);
  filtro = '';

  private host = inject(ElementRef<HTMLElement>);

  selectedOptions = computed(() => this.options.filter((o) => this.selected.includes(o.id)));

  filteredOptions = computed(() => {
    const q = (this.filtro || '').trim().toLowerCase();
    if (!q) return this.options;
    return this.options.filter((o) => o.label.toLowerCase().includes(q));
  });

  isSelected(id: string) {
    return this.selected.includes(id);
  }

  toggle() {
    this.open.update((v) => !v);
  }

  toggleOne(id: string) {
    const next = this.isSelected(id) ? this.selected.filter((x) => x !== id) : [...this.selected, id];
    this.emit(next);
  }

  remove(id: string, ev: Event) {
    ev.stopPropagation();
    this.emit(this.selected.filter((x) => x !== id));
  }

  private emit(next: string[]) {
    this.selected = next;
    this.selectedChange.emit(next);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(ev.target as Node)) {
      this.open.set(false);
    }
  }
}
