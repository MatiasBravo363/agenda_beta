# Iteración: heartbeat de versión + fix bonus (1.0.24)
Fecha: 2026-05-07
Estado: esperando revisión

## Requerimiento

Tras incidente del 7-mayo (una tab abierta 22 hs con código pre-1.0.18 entró en loop infinito de UPDATEs sobre `visitas`, generando 21k errores 40001/min), implementar un mecanismo que **detecte cuando un cliente tiene código viejo y fuerce recarga**, para que un bug arreglado en una versión X no siga afectando producción si un usuario no recargó la app.

Bugs bonus detectados en el audit del incidente:
1. `APP_VERSION` hardcoded en `status.component.ts` (decía '1.0.21' cuando producción estaba en 1.0.23).
2. Doble carga de permisos al login: `AuthService` invoca `cargarPermisos` 2 veces (en `getSession()` inicial y en evento `SIGNED_IN`).

## Criterios de aceptación

- [x] `public/version.json` generado en cada build con `{ version: pkg.version }`.
- [x] `VersionCheckService` hace fetch al inicio + cada 30 min + en `visibilitychange`.
- [x] Si la versión server difiere del cliente → signal `actualizacionDisponible = true`.
- [x] `UpdateBannerComponent` aparece top-fixed con countdown 30s + botón "Actualizar ahora".
- [x] Al llegar a 0, recarga automática (`window.location.reload()`).
- [x] Banner aparece en todas las rutas (montado en `app.ts`, antes del `<router-outlet>`).
- [x] `/status` muestra la versión correcta (lee `pkg.version`, no hardcoded).
- [x] `PermisosService.cargar()` ignora la 2ª llamada para el mismo userId.
- [x] Build OK + lint sin errors + tests pasan.

## Notas visuales / referencias

- Banner usa colores `bg-amber-500 text-white` para alta visibilidad sin ser disruptivo.
- Patrón del countdown copia el del cooldown de "Reenviar email" en `reset-password.component.ts` (1.0.22).
- `version.json` usa cache-buster `?t=Date.now()` para evitar que el browser sirva una versión vieja del JSON.

## Prioridad

obligatoria

## Archivos modificados

- [agenda-beta/package.json](../../agenda-beta/package.json) — bump `1.0.23` → `1.0.24`.
- [agenda-beta/src/app/core/error/sentry.init.ts](../../agenda-beta/src/app/core/error/sentry.init.ts) — `APP_VERSION = '1.0.24'`.
- [agenda-beta/scripts/generate-env.mjs](../../agenda-beta/scripts/generate-env.mjs) — agregar generación de `public/version.json`.
- [agenda-beta/src/app/core/services/version-check.service.ts](../../agenda-beta/src/app/core/services/version-check.service.ts) — **nuevo**.
- [agenda-beta/src/app/shared/components/update-banner.component.ts](../../agenda-beta/src/app/shared/components/update-banner.component.ts) — **nuevo**.
- [agenda-beta/src/app/app.ts](../../agenda-beta/src/app/app.ts) — inyectar `VersionCheckService`, llamar `iniciar()` en `ngOnInit`, importar `UpdateBannerComponent`.
- [agenda-beta/src/app/app.html](../../agenda-beta/src/app/app.html) — agregar `<app-update-banner/>` antes del router-outlet.
- [agenda-beta/src/app/features/status/status.component.ts](../../agenda-beta/src/app/features/status/status.component.ts) — borrar hardcoded, leer `pkg.version`.
- [agenda-beta/src/app/core/services/permisos.service.ts](../../agenda-beta/src/app/core/services/permisos.service.ts) — guard `ultimoUserCargado` en `cargar()`.
- [CHANGELOG.md](../../CHANGELOG.md) — entrada `[1.0.24] — 2026-05-07`.

## Validación post-deploy

1. `https://agenda-beta-zeta.vercel.app/version.json` devuelve `{ "version": "1.0.24" }`.
2. F12 → Network → recargar la app limpia: 1 sola llamada a `usuarios`/`tipos_usuario`/`tipos_usuario_permisos`/`permisos` (no 2 como antes).
3. F12 → Network → filtrar `version.json`: 1 fetch al cargar, otro al volver de cambiar de tab.
4. `/status` muestra `agenda-beta@1.0.24` (no `1.0.21`).
5. Para probar el banner: en preview de Vercel deploy 1.0.24, manualmente editar el `version.json` deployed (o publicar otro deploy con bump 1.0.25 sin recargar la tab abierta) → al siguiente heartbeat aparece el banner amber con countdown.

## Mejora aplicada (tras revisión)

_(se completa en Fase 3 si el usuario solicita ajustes)_
