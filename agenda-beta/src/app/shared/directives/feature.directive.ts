import { Directive, Input, OnInit, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { FeatureFlagsService } from '../../core/services/feature-flags.service';

/**
 * *appFeature="'ui_paginacion_visible'"
 * Renderiza el template solo si el flag está habilitado.
 * Reactivo: si el flag cambia (via load() externo), re-renderiza.
 */
@Directive({
  selector: '[appFeature]',
  standalone: true,
})
export class FeatureDirective implements OnInit {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private flags = inject(FeatureFlagsService);

  private keyActual: string | null = null;
  private visible = false;

  @Input() set appFeature(key: string) {
    this.keyActual = key;
    this.actualizar();
  }

  constructor() {
    effect(() => {
      // Depender del signal de flags para reactividad
      this.flags.flags();
      this.actualizar();
    });
  }

  ngOnInit(): void {
    // Asegurar que las flags estén cargadas la primera vez que se monta la directiva
    this.flags.load().catch(() => { /* silencioso: si no carga, las flags quedan vacías */ });
  }

  private actualizar(): void {
    const mostrar = !!this.keyActual && this.flags.isEnabled(this.keyActual);
    if (mostrar && !this.visible) {
      this.vcr.createEmbeddedView(this.tpl);
      this.visible = true;
    } else if (!mostrar && this.visible) {
      this.vcr.clear();
      this.visible = false;
    }
  }
}
