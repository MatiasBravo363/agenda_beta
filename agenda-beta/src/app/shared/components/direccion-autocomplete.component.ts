import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface DireccionSeleccionada {
  display_name: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-direccion-autocomplete',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="relative">
      <input
        class="input"
        type="text"
        [ngModel]="value"
        (ngModelChange)="onTyping($event)"
        (focus)="open.set(true)"
        (blur)="onBlur()"
        [placeholder]="placeholder"
      />
      @if (open() && (loading() || suggestions().length > 0)) {
        <div class="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-auto">
          @if (loading()) {
            <div class="px-3 py-2 text-xs text-slate-400">Buscando…</div>
          }
          @for (s of suggestions(); track s.display_name) {
            <button type="button"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 border-b border-slate-100 last:border-b-0"
                    (mousedown)="select(s)">
              {{ s.display_name }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class DireccionAutocompleteComponent {
  @Input() value = '';
  @Input() placeholder = 'Calle y número, comuna…';
  @Output() valueChange = new EventEmitter<string>();
  @Output() selected = new EventEmitter<DireccionSeleccionada>();

  suggestions = signal<NominatimResult[]>([]);
  open = signal(false);
  loading = signal(false);

  private debounceTimer: any = null;

  onTyping(v: string) {
    this.value = v;
    this.valueChange.emit(v);
    clearTimeout(this.debounceTimer);
    if (!v || v.trim().length < 3) {
      this.suggestions.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.debounceTimer = setTimeout(() => this.fetchSuggestions(v), 500);
  }

  private async fetchSuggestions(q: string) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&accept-language=es`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = (await res.json()) as NominatimResult[];
      this.suggestions.set(data);
    } catch {
      this.suggestions.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  select(s: NominatimResult) {
    this.value = s.display_name;
    this.open.set(false);
    this.suggestions.set([]);
    this.valueChange.emit(this.value);
    this.selected.emit({
      display_name: s.display_name,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
    });
  }

  onBlur() { setTimeout(() => this.open.set(false), 150); }
}
