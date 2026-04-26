import { Injectable, computed, inject, signal } from '@angular/core';
import { PermisoCodigo } from '../models';
import { TiposUsuarioService } from './tipos-usuario.service';

/**
 * Estado global de permisos del usuario logueado (front-only enforcement).
 * Se carga al login y se limpia al logout. RLS en DB hace el gating real
 * de operaciones sensibles (delete, escritura en tablas de permisos).
 */
@Injectable({ providedIn: 'root' })
export class PermisosService {
  private tiposSvc = inject(TiposUsuarioService);

  private codigosSig = signal<Set<PermisoCodigo>>(new Set());
  private tipoSig = signal<string | null>(null);
  private cargadoSig = signal(false);
  private cargaPromise: Promise<void> | null = null;

  readonly codigos = computed(() => Array.from(this.codigosSig()));
  readonly tipo = this.tipoSig.asReadonly();
  readonly cargado = this.cargadoSig.asReadonly();

  tiene(codigo: PermisoCodigo): boolean {
    return this.codigosSig().has(codigo);
  }

  tieneAlguno(...codigos: PermisoCodigo[]): boolean {
    const set = this.codigosSig();
    return codigos.some((c) => set.has(c));
  }

  /**
   * Devuelve una promesa que resuelve cuando la carga de permisos termina
   * (con éxito o error). Si nadie llamó `cargar()` todavía, espera hasta
   * `timeoutMs`; si no carga, lanza error → guards deben fallar cerrados.
   */
  async waitUntilLoaded(timeoutMs = 5000): Promise<void> {
    if (this.cargadoSig()) return;
    if (this.cargaPromise) {
      await this.cargaPromise;
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        if (this.cargadoSig()) return resolve();
        if (Date.now() - start > timeoutMs) return reject(new Error('PermisosService: timeout esperando carga'));
        setTimeout(tick, 50);
      };
      tick();
    });
  }

  async cargar(userId: string): Promise<void> {
    this.cargaPromise = (async () => {
      try {
        const [codigos, tipoNombre] = await Promise.all([
          this.tiposSvc.permisosDeUsuario(userId),
          this.tiposSvc.list().then((tipos) => {
            // Hack simple: buscar el tipo del usuario
            return this.obtenerNombreTipo(userId, tipos);
          }),
        ]);
        this.codigosSig.set(new Set(codigos));
        this.tipoSig.set(tipoNombre);
      } finally {
        this.cargadoSig.set(true);
      }
    })();
    return this.cargaPromise;
  }

  private async obtenerNombreTipo(userId: string, _tipos: Array<{ id: string; nombre: string }>): Promise<string | null> {
    // Si se quiere usar, consultar usuarios.tipo_usuario_id. Simplificado: null.
    return null;
  }

  limpiar(): void {
    this.codigosSig.set(new Set());
    this.tipoSig.set(null);
    this.cargadoSig.set(false);
    this.cargaPromise = null;
  }
}
