import { Component, Input } from '@angular/core';

/**
 * Bloque skeleton para loading states.
 *
 *   <app-skeleton></app-skeleton>                  Una línea (h-4)
 *   <app-skeleton lines="3"></app-skeleton>        3 líneas apiladas
 *   <app-skeleton variant="card"></app-skeleton>   Card más alto
 *   <app-skeleton variant="circle"></app-skeleton> Avatar circular (h-10 w-10)
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @if (variant === 'circle') {
      <div class="rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse h-10 w-10"></div>
    } @else if (variant === 'card') {
      <div class="rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse h-24 w-full"></div>
    } @else {
      <div class="space-y-2">
        @for (_ of arr(); track $index) {
          <div class="rounded bg-slate-200 dark:bg-slate-700 animate-pulse h-4 w-full"></div>
        }
      </div>
    }
  `,
})
export class SkeletonComponent {
  @Input() variant: 'line' | 'card' | 'circle' = 'line';
  @Input() lines = 1;

  arr() {
    return Array.from({ length: Math.max(1, this.lines) });
  }
}
