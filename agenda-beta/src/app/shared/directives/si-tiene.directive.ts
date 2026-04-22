import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { PermisosService } from '../../core/services/permisos.service';
import { PermisoCodigo } from '../../core/models';

/**
 * *appSiTiene="'actividades.borrar'"
 * Renderiza el template solo si el usuario tiene el permiso indicado.
 * Reactivo a cambios del signal de permisos.
 */
@Directive({
  selector: '[appSiTiene]',
  standalone: true,
})
export class SiTieneDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private permisos = inject(PermisosService);

  private codigoActual: PermisoCodigo | null = null;
  private visible = false;

  @Input() set appSiTiene(codigo: PermisoCodigo) {
    this.codigoActual = codigo;
    this.actualizar();
  }

  constructor() {
    effect(() => {
      // Depender del signal para reactividad
      this.permisos.codigos();
      this.actualizar();
    });
  }

  private actualizar() {
    const mostrar = !!this.codigoActual && this.permisos.tiene(this.codigoActual);
    if (mostrar && !this.visible) {
      this.vcr.createEmbeddedView(this.tpl);
      this.visible = true;
    } else if (!mostrar && this.visible) {
      this.vcr.clear();
      this.visible = false;
    }
  }
}
