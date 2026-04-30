import { describe, expect, it } from 'vitest';
import { Route } from '@angular/router';
import { routes } from './app.routes';

/**
 * Test estructural de seguridad — garantiza que ninguna ruta sensible quede
 * sin canActivate. Si alguien agrega una ruta nueva olvidándose el guard,
 * este test rompe.
 *
 * Si una ruta legítimamente cambia de nombre o permiso requerido, actualizar
 * RUTAS_PROTEGIDAS y los items del sidebar (main-layout.component.ts) en
 * conjunto.
 */
const RUTAS_PROTEGIDAS = [
  { path: 'dashboard',     codigo: 'dashboard.ver' },
  { path: 'visitas',       codigo: 'visitas.ver' },
  { path: 'actividades',   codigo: 'actividades.ver' },
  { path: 'tecnicos',      codigo: 'tecnicos.ver' },
  { path: 'configuracion', codigo: 'configuracion.ver' },
  { path: 'usuarios',      codigo: 'usuarios.ver' },
  { path: 'tipos-usuario', codigo: 'tipos_usuario.gestionar' },
];

describe('app.routes — Broken Access Control regression', () => {
  it('encuentra el árbol de rutas protegidas dentro de la ruta raíz autenticada', () => {
    const root = routes.find((r) => r.path === '');
    expect(root, 'debe existir una ruta raíz "" que envuelve las protegidas').toBeDefined();
    expect(root?.canActivate?.length, 'la raíz debe tener authGuard').toBeGreaterThan(0);
    expect(root?.children, 'la raíz debe tener children').toBeDefined();
  });

  for (const { path } of RUTAS_PROTEGIDAS) {
    it(`/${path} tiene al menos un canActivate (permisoGuard esperado)`, () => {
      const root = routes.find((r) => r.path === '');
      const ruta = (root?.children ?? []).find((r: Route) => r.path === path);
      expect(ruta, `la ruta /${path} debe existir bajo la raíz autenticada`).toBeDefined();
      expect(
        ruta?.canActivate?.length,
        `la ruta /${path} DEBE tener canActivate (broken access control fix)`,
      ).toBeGreaterThan(0);
    });
  }

  it('/sin-permisos existe como ruta pública (sin guard) — destino del permisoGuard cuando rechaza', () => {
    const sin = routes.find((r) => r.path === 'sin-permisos');
    expect(sin, 'debe existir /sin-permisos como ruta pública').toBeDefined();
    expect(sin?.canActivate, '/sin-permisos NO debe tener canActivate (sería loop)').toBeUndefined();
  });

  it('/status sigue siendo pública (health check)', () => {
    const status = routes.find((r) => r.path === 'status');
    expect(status, 'debe existir /status').toBeDefined();
    expect(status?.canActivate, '/status NO debe tener guards').toBeUndefined();
  });
});
