import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Atrapa el foco dentro del elemento al que se aplica. Útil en modales/dialogs.
 * Tab/Shift+Tab loopean entre el primer y último elemento focusable.
 *
 * Uso:
 *   <div appFocusTrap class="modal">...</div>
 */
@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  private previouslyFocused: HTMLElement | null = null;
  private keydownHandler = this.onKeydown.bind(this);

  ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    const first = this.firstFocusable();
    first?.focus();
    this.host.nativeElement.addEventListener('keydown', this.keydownHandler);
  }

  ngOnDestroy(): void {
    this.host.nativeElement.removeEventListener('keydown', this.keydownHandler);
    // Devolver el foco al elemento que tenía antes de abrir el modal
    this.previouslyFocused?.focus?.();
  }

  private onKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Tab') return;
    const focusables = this.allFocusable();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (ev.shiftKey && active === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && active === last) {
      ev.preventDefault();
      first.focus();
    }
  }

  private allFocusable(): HTMLElement[] {
    const nodeList = this.host.nativeElement.querySelectorAll(FOCUSABLE_SELECTOR);
    const elements: HTMLElement[] = [];
    nodeList.forEach((node: Element) => {
      if (node instanceof HTMLElement && !node.hasAttribute('disabled') && node.offsetParent !== null) {
        elements.push(node);
      }
    });
    return elements;
  }

  private firstFocusable(): HTMLElement | null {
    return this.allFocusable()[0] ?? null;
  }
}
