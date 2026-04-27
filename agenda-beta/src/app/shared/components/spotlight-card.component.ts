import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';

type Tone = 'indigo' | 'amber' | 'rose' | 'green';

@Component({
  selector: 'app-spotlight-card',
  standalone: true,
  template: `
    <div class="relative overflow-hidden rounded-xl border bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-lg"
         [class.border-slate-200]="!active"
         [class.dark:border-slate-800]="!active"
         [class.shadow-md]="active"
         [style.border-color]="active ? accentColor() : null"
         [style.border-width]="active ? '2px' : '1px'"
         [style.padding]="active ? '19px' : '20px'"
         [style]="bgStyle()">
      @if (active) {
        <span class="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
              [style.background]="accentColor()"
              [style.color]="'#fff'">Filtrando</span>
      }
      <div class="relative z-10">
        <div class="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{{ title }}</div>
        <div class="mt-2 text-4xl font-bold" [style.color]="accentColor()">{{ count }}</div>
        @if (hint) {
          <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ hint }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class SpotlightCardComponent {
  @Input() title = '';
  @Input() count = 0;
  @Input() hint = '';
  @Input() tone: Tone = 'indigo';
  @Input() customColor?: string;
  @Input() active = false;

  private host = inject(ElementRef<HTMLElement>);
  private mx = 50;
  private my = 50;

  @HostListener('mousemove', ['$event'])
  onMove(ev: MouseEvent) {
    const rect = (this.host.nativeElement as HTMLElement).getBoundingClientRect();
    this.mx = ((ev.clientX - rect.left) / rect.width) * 100;
    this.my = ((ev.clientY - rect.top) / rect.height) * 100;
    (this.host.nativeElement as HTMLElement).style.setProperty('--mx', `${this.mx}%`);
    (this.host.nativeElement as HTMLElement).style.setProperty('--my', `${this.my}%`);
  }

  accentColor(): string {
    if (this.customColor) return this.customColor;
    switch (this.tone) {
      case 'amber': return '#b45309';
      case 'rose': return '#be123c';
      case 'green': return '#2f8f34';
      default: return '#4338ca';
    }
  }

  private glowColor(): string {
    if (this.customColor) return this.hexToRgba(this.customColor, 0.32);
    switch (this.tone) {
      case 'amber': return 'rgba(245, 158, 11, 0.28)';
      case 'rose': return 'rgba(244, 63, 94, 0.28)';
      case 'green': return 'rgba(92, 203, 95, 0.38)';
      default: return 'rgba(99, 102, 241, 0.28)';
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  bgStyle(): string {
    return `background-image: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), ${this.glowColor()}, transparent 55%);`;
  }
}
