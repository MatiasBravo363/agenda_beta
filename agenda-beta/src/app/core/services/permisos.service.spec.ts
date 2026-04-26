import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PermisosService } from './permisos.service';
import { TiposUsuarioService } from './tipos-usuario.service';

function makeMockTiposSvc(permisos: string[]) {
  return {
    permisosDeUsuario: vi.fn().mockResolvedValue(permisos),
    list: vi.fn().mockResolvedValue([]),
  } as unknown as TiposUsuarioService;
}

describe('PermisosService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('arranca sin permisos cargados', () => {
    TestBed.configureTestingModule({
      providers: [
        PermisosService,
        { provide: TiposUsuarioService, useValue: makeMockTiposSvc([]) },
      ],
    });
    const svc = TestBed.inject(PermisosService);
    expect(svc.cargado()).toBe(false);
    expect(svc.tiene('visitas.ver' as any)).toBe(false);
  });

  it('después de cargar, refleja los permisos del usuario', async () => {
    TestBed.configureTestingModule({
      providers: [
        PermisosService,
        { provide: TiposUsuarioService, useValue: makeMockTiposSvc(['visitas.ver', 'visitas.crear']) },
      ],
    });
    const svc = TestBed.inject(PermisosService);
    await svc.cargar('user-1');
    expect(svc.cargado()).toBe(true);
    expect(svc.tiene('visitas.ver' as any)).toBe(true);
    expect(svc.tiene('visitas.crear' as any)).toBe(true);
    expect(svc.tiene('usuarios.borrar' as any)).toBe(false);
  });

  it('tieneAlguno devuelve true si tiene al menos uno', async () => {
    TestBed.configureTestingModule({
      providers: [
        PermisosService,
        { provide: TiposUsuarioService, useValue: makeMockTiposSvc(['visitas.ver']) },
      ],
    });
    const svc = TestBed.inject(PermisosService);
    await svc.cargar('user-1');
    expect(svc.tieneAlguno('visitas.ver' as any, 'usuarios.ver' as any)).toBe(true);
    expect(svc.tieneAlguno('usuarios.ver' as any, 'log.ver' as any)).toBe(false);
  });

  it('limpiar() resetea el estado', async () => {
    TestBed.configureTestingModule({
      providers: [
        PermisosService,
        { provide: TiposUsuarioService, useValue: makeMockTiposSvc(['visitas.ver']) },
      ],
    });
    const svc = TestBed.inject(PermisosService);
    await svc.cargar('user-1');
    expect(svc.cargado()).toBe(true);
    svc.limpiar();
    expect(svc.cargado()).toBe(false);
    expect(svc.tiene('visitas.ver' as any)).toBe(false);
  });

  it('waitUntilLoaded resuelve cuando ya está cargado', async () => {
    TestBed.configureTestingModule({
      providers: [
        PermisosService,
        { provide: TiposUsuarioService, useValue: makeMockTiposSvc(['visitas.ver']) },
      ],
    });
    const svc = TestBed.inject(PermisosService);
    await svc.cargar('user-1');
    await expect(svc.waitUntilLoaded(100)).resolves.toBeUndefined();
  });

  it('waitUntilLoaded espera la promesa de cargar() en vuelo', async () => {
    const tipos = makeMockTiposSvc(['visitas.ver']);
    // Demoramos la respuesta de permisosDeUsuario para forzar un await
    (tipos.permisosDeUsuario as any) = vi.fn().mockImplementation(
      () => new Promise((r) => setTimeout(() => r(['visitas.ver']), 30))
    );
    TestBed.configureTestingModule({
      providers: [
        PermisosService,
        { provide: TiposUsuarioService, useValue: tipos },
      ],
    });
    const svc = TestBed.inject(PermisosService);
    const cargaP = svc.cargar('user-1');
    const waitP = svc.waitUntilLoaded(2000);
    await Promise.all([cargaP, waitP]);
    expect(svc.cargado()).toBe(true);
  });

  it('waitUntilLoaded rechaza si nunca se llama cargar()', async () => {
    TestBed.configureTestingModule({
      providers: [
        PermisosService,
        { provide: TiposUsuarioService, useValue: makeMockTiposSvc([]) },
      ],
    });
    const svc = TestBed.inject(PermisosService);
    await expect(svc.waitUntilLoaded(150)).rejects.toThrow(/timeout/);
  });
});
