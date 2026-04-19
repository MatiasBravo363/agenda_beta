import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';

type Tone = 'indigo' | 'amber' | 'rose';

@Component({
  selector: 'app-spotlight-card',
  standalone: true,
  template: `
    <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lg"
         [style]="bgStyle()">
      <div class="relative z-10">
        <div class="text-xs uppercase tracking-wider text-slate-500">{{ title }}</div>
        <div class="mt-2 text-4xl font-bold" [style.color]="accentColor()">{{ count }}</div>
        @if (hint) {
          <div class="mt-1 text-xs text-slate-500">{{ hint }}</div>
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
    switch (this.tone) {
      case 'amber': return '#b45309';
      case 'rose': return '#be123c';
      default: return '#4338ca';
    }
  }

  private glowColor(): string {
    switch (this.tone) {
      case 'amber': return 'rgba(245, 158, 11, 0.28)';
      case 'rose': return 'rgba(244, 63, 94, 0.28)';
      default: return 'rgba(99, 102, 241, 0.28)';
    }
  }

  bgStyle(): string {
    return `background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), ${this.glowColor()}, transparent 55%), white;`;
  }
}
