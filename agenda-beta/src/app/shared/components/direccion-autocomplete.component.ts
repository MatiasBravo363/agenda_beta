import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface NominatimAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

export interface DireccionSeleccionada {
  display_name: string;
  lat: number;
  lng: number;
}

function shortAddress(r: NominatimResult): string {
  const a = r.address ?? {};
  const comuna = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? '';
  const calle = a.road ?? '';
  const numero = a.house_number ?? '';
  const linea = [calle, numero].filter(Boolean).join(' ');
  const partes = [linea, comuna].filter(Boolean);
  return partes.length ? partes.join(', ') : r.display_name.split(',').slice(0, 2).join(',').trim();
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
              <div class="font-medium">{{ shortLabel(s) }}</div>
              <div class="text-xs text-slate-400 truncate">{{ s.display_name }}</div>
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

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;

  onTyping(v: string) {
    this.value = v;
    this.valueChange.emit(v);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.abortController?.abort();
    if (!v || v.trim().length < 3) {
      this.suggestions.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.debounceTimer = setTimeout(() => this.fetchSuggestions(v), 1000);
  }

  private async fetchSuggestions(q: string) {
    this.abortController = new AbortController();
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&accept-language=es&countrycodes=cl`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'Accept-Language': 'es' },
        signal: this.abortController.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as NominatimResult[];
      this.suggestions.set(data);
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== 'AbortError') this.suggestions.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  shortLabel(s: NominatimResult) { return shortAddress(s); }

  select(s: NominatimResult) {
    const short = shortAddress(s);
    this.value = short;
    this.open.set(false);
    this.suggestions.set([]);
    this.valueChange.emit(this.value);
    this.selected.emit({
      display_name: short,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
    });
  }

  onBlur() { setTimeout(() => this.open.set(false), 150); }
}
