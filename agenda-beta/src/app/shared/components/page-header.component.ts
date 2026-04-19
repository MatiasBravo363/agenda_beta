import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="flex items-end justify-between px-8 pt-8 pb-6 border-b border-slate-200 bg-white">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">{{ title }}</h1>
        @if (subtitle) {
          <p class="text-sm text-slate-500 mt-1">{{ subtitle }}</p>
        }
      </div>
      <div class="flex gap-2">
        <ng-content/>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
