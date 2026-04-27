# Iteración: Security fix (Broken Access Control) + Visitas (cards-filtro + sort desc)
Fecha: 2026-04-27
Estado: esperando revisión

## Requerimiento

Tres cambios bundleados en la 1.0.15:

**1) Security fix — Broken Access Control (OWASP A01:2021)**
Variante *Missing Function Level Access Control*. Las rutas `/dashboard`, `/visitas/*`, `/actividades`, `/tecnicos`, `/historial`, `/configuracion` no tenían `permisoGuard` — el sidebar las ocultaba con `*appSiTiene` pero un usuario sin permiso accedía tipeando la URL directo.

**2) KPI cards clickeables como filtro de estado** (lista + calendario).

**3) Orden descendente por fecha** en el agrupado de `/visitas/lista` (más reciente arriba).

Sumamos también dos bugs de regresión de 1.0.14:
- **Sidebar mostraba versión vieja** → fixeado con bump a 1.0.15 (lee de `package.json`).
- **Paginación oculta en lista de visitas** → estaba detrás del feature flag `ui_paginacion_visible`. Quitamos el flag para que sea siempre visible.

## Criterios de aceptación

### Security
- [ ] Usuario sin `dashboard.ver` que tipee `/dashboard` → redirige a `/sin-permisos` (no renderiza el dashboard).
- [ ] Idem para las otras 5 rutas.
- [ ] Super admin (con todos los permisos) accede normal.
- [ ] No hay loop de redirect (el guard no manda a `/visitas` si esa ruta también está gateada).
- [ ] Spec de regresión que verifica el mapeo ruta → permisoGuard.

### Cards filtro
- [ ] Click en card de `/visitas/lista` → filtra grid por ese estado.
- [ ] Click otra vez en la card activa → limpia el filtro.
- [ ] Click en otra card → cambia el filtro.
- [ ] Card activa tiene indicador visual (ring + badge "Filtrando").
- [ ] Misma UX en `/visitas/calendario`.

### Sort desc
- [ ] Grupos de día en `/visitas/lista` aparecen del más reciente al más antiguo.
- [ ] Dentro del día, visitas ordenadas como hoy (por hora).

### Regresiones de 1.0.14
- [ ] Paginador visible siempre en `/visitas/lista` (sin feature flag).
- [ ] Sidebar muestra "V1.0.15".

## Notas visuales / referencias

- Card activa: `ring-2` con color del estado + badge "Filtrando" arriba a la derecha.
- Página `/sin-permisos`: layout minimal sin sidebar (similar a `/status`), mensaje claro + botón "Volver al inicio" que va a `/visitas` (si el usuario tiene `visitas.ver`) o `/login` (si no, signOut).

## Prioridad

obligatoria

## Archivos modificados

### Security
- [agenda-beta/src/app/app.routes.ts](../../agenda-beta/src/app/app.routes.ts) — `canActivate: [permisoGuard('XX')]` en 6 rutas + ruta nueva `/sin-permisos` + comentario al tope con la convención.
- [agenda-beta/src/app/core/auth/permiso.guard.ts](../../agenda-beta/src/app/core/auth/permiso.guard.ts) — redirect cambiado de `/visitas` a `/sin-permisos` para evitar loop.
- [agenda-beta/src/app/features/sin-permisos/sin-permisos.component.ts](../../agenda-beta/src/app/features/sin-permisos/sin-permisos.component.ts) (nuevo) — página pública sin sidebar con mensaje + botones "Volver al inicio" / "Cerrar sesión". `volverAlInicio()` decide a dónde mandar según los permisos del usuario.
- [agenda-beta/src/app/app.routes.spec.ts](../../agenda-beta/src/app/app.routes.spec.ts) (nuevo) — 10 tests de regresión que verifican el mapping ruta → permisoGuard.

### Visitas
- [agenda-beta/src/app/shared/components/spotlight-card.component.ts](../../agenda-beta/src/app/shared/components/spotlight-card.component.ts) — input `active` + estilo activo (border 2px del color del estado + badge "Filtrando").
- [agenda-beta/src/app/features/visitas/visitas-list.component.ts](../../agenda-beta/src/app/features/visitas/visitas-list.component.ts) — cards envueltas en `<button>` con `toggleEstadoFiltro(e)`. Quitado `*appFeature` del paginador (ahora siempre visible). Removida import de `FeatureDirective`.
- [agenda-beta/src/app/features/visitas/visitas-calendar.component.ts](../../agenda-beta/src/app/features/visitas/visitas-calendar.component.ts) — idem cards. Método `toggleEstadoFiltro(e)` análogo.
- [agenda-beta/src/app/features/visitas/visitas-grupos.util.ts](../../agenda-beta/src/app/features/visitas/visitas-grupos.util.ts) — invertido sort de grupos a descendente.
- [agenda-beta/src/app/features/visitas/visitas-grupos.util.spec.ts](../../agenda-beta/src/app/features/visitas/visitas-grupos.util.spec.ts) — tests actualizados al nuevo orden + 1 test extra con 3 días.

### Versionado
- [agenda-beta/package.json](../../agenda-beta/package.json) — bump 1.0.14 → 1.0.15.
- [agenda-beta/src/app/core/error/sentry.init.ts](../../agenda-beta/src/app/core/error/sentry.init.ts) — `APP_VERSION` 1.0.14 → 1.0.15.
- [CHANGELOG.md](../../CHANGELOG.md) — entradas para 1.0.14 (que faltaba) y 1.0.15 con secciones Security + Added + Changed + Fixed.

### Validación
- `npm test`: 49/49 ✅ (37 previos + 10 de app.routes.spec + 1 nuevo en grupos.util + 1 modificado).
- `npm run lint`: 0 errors, 103 warnings (sin regresiones).
- `npm run build` dev: ✅

## Mejora aplicada (tras revisión)

_(se completa en Fase 3)_
