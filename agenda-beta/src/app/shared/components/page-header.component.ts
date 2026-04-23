import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{{ title }}</h1>
        @if (subtitle) {
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ subtitle }}</p>
        }
      </div>
      <div class="flex flex-wrap gap-2">
        <ng-content/>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
