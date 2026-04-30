# Changelog

Todos los cambios notables del proyecto se documentan acá.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.20] — 2026-04-30

Performance hardening tras aviso de Supabase "max CPU usage exceeded 80%". Mitigación estimada: ~70% menos carga DB.

### Changed
- **`/visitas/calendario` filtra por rango visible** ([visitas-calendar.component.ts](agenda-beta/src/app/features/visitas/visitas-calendar.component.ts)). Antes cargaba `svc.list()` sin filtro temporal (hasta 500 visitas con 5-join). Ahora hookea el evento `datesSet` de FullCalendar y dispara `listPaged({ desde, hasta })` con debounce 250ms. Solo trae las visitas del rango visible (typically 30-100 vs 500 globales).
- **`/dashboard` default semana actual + cap de 6 meses** ([dashboard.component.ts](agenda-beta/src/app/features/dashboard/dashboard.component.ts)). Antes: default mes actual + cargaba `svc.list()` sin filtro. Ahora: default semana, carga vía `listPaged({ desde, hasta })` con filtro server-side, y muestra banner "Rango máximo permitido: 6 meses" + bloquea charts si el usuario excede el cap. Botón "Volver a semana actual" para resetear.
- **`listPaged()` usa `count: 'estimated'` en lugar de `'exact'`** ([visitas.service.ts](agenda-beta/src/app/core/services/visitas.service.ts)). PostgREST devuelve estimación basada en `pg_class.reltuples` (sin scan). El "Total" en el footer puede estar ±5% (UX aceptable). Era el principal hotspot CPU según el informe de performance.

### Removed
- **Vista `/historial`** completa: borrado [features/history/history.component.ts](agenda-beta/src/app/features/history/), [core/services/history.service.ts](agenda-beta/src/app/core/services/history.service.ts), entrada del sidebar y la ruta de `app.routes.ts` (+ test correspondiente). El permiso `historial.ver` queda inerte en `PermisoCodigo` y DB para retrocompat (no requiere migración). La tabla `visitas_historial` y trigger 017 siguen activos para trazabilidad — son auditables vía Supabase Dashboard si hace falta.

## [1.0.19] — 2026-04-30

### Changed
- **RLS de pivotes abierta a `authenticated`** (migración 021). Antes (mig. 012) `visita_tecnicos` y `visita_actividades` requerían que el usuario sea creador de la visita o super_admin para INSERT/UPDATE/DELETE; coordinadores editando visitas ajenas recibían `new row violates row-level security policy for table "visita_tecnicos"`. Ahora cualquier autenticado puede mutar los pivotes — el gate único es `visitas.editar` a nivel form. Mismo modelo que la tabla `visitas` desde migración 007.

### Notas operativas
- **Aplicar migración 021 manualmente en Supabase Dashboard** antes de mergear a producción.
- Validaciones que **siguen activas** (recomendadas): coherencia `nombre_cliente`/`estado`/actividades, bidir estado↔técnico, fechas válidas, optimistic locking (trigger 015), audit log con delta jsonb (trigger 017).
- **Pendientes para evaluar** en una iteración futura: RLS DELETE de `visitas` sigue restringida a creador o super_admin (`visitas.borrar` no es gate efectivo cross-user); `visitas.crear` no se chequea explícitamente (lo cubre `visitas.editar`).

## [1.0.18] — 2026-04-29

### Added
- **ID correlativo (`#numero`) visible** en el header del form de visita ([visita-form.component.ts](agenda-beta/src/app/features/visitas/visita-form.component.ts)). Solo aparece para visitas existentes, no para "nueva".
- **Calendar lateral con drag-range selection** en `/visitas/lista`. Click simple = 1 día. Click + arrastre = rango. Default al cargar: lunes a domingo de la semana actual. El rango es la única fuente de verdad del filtro temporal — los inputs Desde/Hasta fueron quitados.
- **`ESTADOS_REQUIEREN_TECNICO`** exportado desde [estado.util.ts](agenda-beta/src/app/core/utils/estado.util.ts) (antes hard-coded en `visitas-calendar.component.ts`).
- **`isoToDatetimeLocal` / `datetimeLocalToISO`** en [datetime.util.ts](agenda-beta/src/app/core/utils/datetime.util.ts) (nuevo) — parseo de fechas determinista cross-browser usando `new Date(y, m-1, d, h, mi)` con componentes numéricos.

### Changed
- **Form de visita ahora gateado por `visitas.editar`**. Sin el permiso, el form muestra banner "Modo solo lectura" + todos los inputs disabled (vía `<fieldset disabled>`). Aplica uniforme a todas las visitas, incluido `completada`.
- **Trigger 013 removido** (migración 020). Antes bloqueaba `en_cola → completada` y `completada → otros estados` para no super_admin. Ahora `visitas.editar` es el único gate: cualquier coordinador con el permiso puede hacer cualquier transición. Las validaciones de coherencia (estado↔técnico) siguen en el form. Razón: los coordinadores con permiso de edición necesitan poder corregir errores de marcado y reabrir visitas por reclamos sin depender de super_admin.

### Fixed
- **Bug de fecha al clonar visitas**. `toLocal/fromLocal` usaban `new Date(string)` con strings sin TZ, parseo inconsistente entre browsers. Reemplazado por util compartido con regex + componentes numéricos.
- **Validación bidireccional estado ↔ técnico** en `save()` del form. Antes solo validaba "si hay técnicos → estado debe ser X". Ahora también "si estado es X → debe haber al menos un técnico".

## [1.0.17] — 2026-04-27

### Fixed
- **Charts del dashboard que renderizaban vacíos** (donut estados, funnel, barras técnicos, heatmap día×hora, tasa fallo por actividad). El bug venía desde 1.0.14 cuando se sumaron los charts nuevos. Causa raíz: [dashboard.routes.ts](agenda-beta/src/app/features/dashboard/dashboard.routes.ts) usa partial-import de echarts (tree-shaking para mantener bundle bajo) y solo registraba `LineChart`. Los tipos `pie`/`bar`/`funnel`/`heatmap` y los componentes `visualMap`/`graphic` faltaban — echarts los ignora silenciosamente sin warning. Registrados todos. Comentario al tope del archivo documenta la convención: si agregás un chart nuevo, registrá su tipo o no va a renderizar.
- Intentos previos descartados (1.0.14 reescritura sin spread roto, 1.0.16 `@if filtered.length > 0`) atacaban síntomas distintos pero no la causa real.

## [1.0.16] — 2026-04-27

### Fixed
- **Postbuild de Sentry no bloquea deploy a producción**. El deploy de 1.0.15 falló porque el `SENTRY_AUTH_TOKEN` configurado en Vercel está expirado/inválido (HTTP 401). Como consecuencia, los fixes de la 1.0.14 (charts del dashboard que estaban vacíos) y 1.0.15 (security + visitas) no llegaron a producción aunque estaban en main. Ahora [scripts/upload-sourcemaps.sh](agenda-beta/scripts/upload-sourcemaps.sh) loguea WARNING y sale 0 si la subida a Sentry falla — los source maps son nice-to-have, no deben bloquear releases.
- **Acción operativa pendiente**: rotar `SENTRY_AUTH_TOKEN` en Sentry y actualizar la env var en Vercel scope Production. Mientras no se haga, los stack traces en Sentry van a verse ofuscados pero los deploys salen igual.

## [1.0.15] — 2026-04-27

### Security
- **Broken Access Control fix (OWASP A01:2021 — Missing Function Level Access Control)**. Las rutas `/dashboard`, `/visitas/*`, `/actividades`, `/tecnicos`, `/historial` y `/configuracion` no tenían `permisoGuard` — el sidebar las ocultaba con `*appSiTiene` pero un usuario podía acceder tipeando la URL directo. Agregado `canActivate: [permisoGuard('X.ver')]` a las 6 rutas. ([agenda-beta/src/app/app.routes.ts](agenda-beta/src/app/app.routes.ts))
- Nueva ruta pública `/sin-permisos` ([agenda-beta/src/app/features/sin-permisos/sin-permisos.component.ts](agenda-beta/src/app/features/sin-permisos/sin-permisos.component.ts)) destino del `permisoGuard` cuando rechaza acceso. Antes redirigía a `/visitas` que ahora también está gateado, generando potencial loop de redirect.
- Spec de regresión [agenda-beta/src/app/app.routes.spec.ts](agenda-beta/src/app/app.routes.spec.ts) que verifica que cada ruta sensible tenga `canActivate`. Si alguien agrega una ruta nueva sin guard, el test rompe.
- Comentario al tope de `app.routes.ts` documentando la convención: ítem `*appSiTiene='X.ver'` ↔ ruta con `permisoGuard('X.ver')` con el mismo código.

### Added
- **KPI cards clickeables como filtro** en `/visitas/lista` y `/visitas/calendario`. Click en card → filtra por ese estado. Click otra vez → limpia. Card activa muestra ring del color del estado + badge "Filtrando". Input nuevo `active` en [SpotlightCardComponent](agenda-beta/src/app/shared/components/spotlight-card.component.ts).

### Changed
- **Orden descendente** de los grupos por día en `/visitas/lista` (más reciente arriba). Antes era ascendente. Cambio en [visitas-grupos.util.ts](agenda-beta/src/app/features/visitas/visitas-grupos.util.ts) + spec actualizado.

### Fixed
- **Paginador siempre visible** en `/visitas/lista`. Antes estaba detrás del feature flag `ui_paginacion_visible` y si el flag estaba off, el usuario solo veía 50 visitas sin posibilidad de navegar. Quitado el `*appFeature`.
- **Versión en sidebar**: bump a 1.0.15 (lee de `package.json`). En 1.0.14 podía verse stale por orden de releases.

## [1.0.14] — 2026-04-27

### Added
- Calendario responsive con `viewportSize` signal + `@HostListener('window:resize')` debounceado. Tres modos: mobile/tablet/desktop con altura dinámica que llena el viewport.
- Sidebar "En cola" plegable con persistencia en localStorage. Animación pulse cuando está plegado y hay cola.
- Dashboard: 6 charts nuevos (line actividades/día, donut estados, barras % técnicos con destaque Bermann, funnel snapshot, tasa de fallo por actividad, heatmap día×hora).
- KPIs nuevos en dashboard: tasa de cumplimiento, en cola, reagendadas.
- `charts.util.ts` con helpers compartidos para charts.

### Fixed
- Spread roto de `baseOptions` rompía donut/funnel/barras/heatmap (charts vacíos). Reescritos sin spread, con tooltip/legend/grid inline. Barras horizontales ahora usan data primitiva + `itemStyle.color` callback.

## [Unreleased] — 1.0.13

Cierre de P1 + P2 del informe de production-readiness ([SOP/2026-04-25-production-readiness-assessment.md](SOP/2026-04-25-production-readiness-assessment.md)).

### Added
- **Optimistic locking** en `visitas` (migración 015 + cambios en `VisitasService.update`). Trigger BEFORE UPDATE rechaza con código `40001` si el `updated_at` del payload no coincide con DB. Bypass para super_admin.
- **Índices compuestos** en `visitas` (migración 016): `(fecha_inicio, estado, tecnico_id)` para dashboard, `created_by`, `parent_visita_id` parcial, `(visita_id, created_at desc)` en historial.
- **Audit log extendido** (migración 017): nueva función `log_visita_change()` reemplaza `log_visita_estado_change()`. Captura cambios de **todos** los campos relevantes con delta jsonb. Columnas nuevas: `cambios jsonb`, `accion text`.
- **Feature flags** (migración 018): tabla `public.feature_flags` con RLS, `FeatureFlagsService` y directiva `*appFeature` análoga a `*appSiTiene`.
- **Schema version backfill** (migración 019): registro 015-019 en `public.schema_version`.
- **CI GitHub Actions** ([.github/workflows/ci.yml](.github/workflows/ci.yml)): jobs paralelos lint + test + build en cada PR y push a main.
- **ESLint flat config** ([agenda-beta/eslint.config.js](agenda-beta/eslint.config.js)) con preset `angular-eslint` v21 + `typescript-eslint` v8. Scripts `lint`, `lint:fix`, `format` en package.json.
- **Pre-commit hook** opcional en [.husky/pre-commit](.husky/pre-commit) ejecutando lint-staged. Activación manual: `git config core.hooksPath .husky`.
- **CHANGELOG.md** (este archivo) con backfill de releases anteriores.
- **Source maps automáticos a Sentry** vía script `agenda-beta/scripts/upload-sourcemaps.sh` ejecutado en build de Vercel cuando `SENTRY_AUTH_TOKEN` está configurado.
- **UI de paginación visible** en `/visitas/lista` consumiendo `VisitasService.listPaged()` (que ya existía como dormant en 1.0.12). Selector de tamaño de página + footer con páginas + total. Filtros movidos a server-side.
- **Confirmación al marcar visita como `completada`** en `visita-form` (la transición es irreversible para no super_admin).
- **Export Excel en Visitas** (botón "Exportar XLSX" en `/visitas/lista`). Exporta el resultado actual filtrado.
- **Skeleton loaders** en listas principales (visitas, dashboard, users, tipos-usuario).
- **Focus trap directiva** `appFocusTrap` para modales + audit WCAG AA.
- **Página `/status`** pública con heartbeat a Supabase para distinguir caídas de plataforma vs. red local.
- **Vercel Analytics + Speed Insights** para pageviews y Web Vitals automáticos.
- **Tracking de eventos de negocio** vía `Sentry.addBreadcrumb` (visitas creadas/actualizadas, login, logout).

### Changed
- **VisitasService.update()** ahora requiere `updated_at` en el payload para optimistic locking. Si la DB devuelve error `40001`, lanza `ConflictoVisitaError`. UI captura y ofrece recargar.
- **Refactor de `visitas-calendar`** (680 LOC → ~250 LOC): extracción de `CalendarFiltersComponent`, `CalendarEventBuilderService`, `CalendarLegendComponent`.
- **Refactor de `visitas-list`** (542 LOC → ~250 LOC): extracción de `VisitasFiltrosComponent`, `VisitasGruposPorDiaService`, `VisitasExportService`.
- **Tipado de `any` residuales**: 28 → ≤ 5 ocurrencias justificadas con comentario.
- Bundle warning budget subido a 700kB (Vercel Analytics + tracing agregan ~12kB).

### Security
- 2 vulnerabilidades moderate en `uuid <14` (transitiva vía `exceljs >=3.5.0`) **no se mitigan** porque `npm audit fix --force` degradaría exceljs a 3.4.0 (breaking change que rompe el export Excel). Las vulnerabilidades son issues de buffer-bounds en parseo de UUIDs no expuestos al cliente. Riesgo aceptado y documentado. Reevaluación cuando exceljs publique versión con uuid actualizado.

---

## [1.0.12] — 2026-04-26

Cierre de **P0** del informe de production-readiness.

### Added
- **Sentry** integración (`@sentry/angular`) con `SentryAwareErrorHandler` que envuelve a `ChunkReloadErrorHandler`. `setUser` en login/logout, scrub PII en `beforeSend`, source maps `hidden: true`.
- **Migración 011**: `tipo_usuario_id` default `coordinador` en `handle_new_user` + backfill.
- **Migración 012**: RLS de `visita_tecnicos` y `visita_actividades` restringido a creador o super_admin.
- **Migración 013**: trigger `validar_transicion_visita` bloquea `en_cola → completada` y salidas de `completada` (excepto super_admin).
- **Migración 014**: tabla `public.schema_version` para trazabilidad.
- **Runbook operativo** en [SOP/OPERACION.md](SOP/OPERACION.md).
- **22 tests unitarios** en `estado.util`, `service-error.util`, `permisos.service`, `app`.
- `VisitasService.listPaged()` con filtros server-side (sin UI todavía — añadida en 1.0.13).

### Changed
- **`permisoGuard`** falla cerrada con timeout 5s (eliminado `setTimeout(300)`).
- `VisitasService.list()` con cap defensivo de 500 (antes traía dataset completo).
- Manejo de errores estandarizado: `alert()` en `visitas-list` reemplazado por banner; `try {} catch {}` silencioso en `users.loadTipos()` arreglado.
- `Sentry.TraceService` + `APP_INITIALIZER` registrados (cierra wizard de Sentry).

### Fixed
- **`fileReplacements`** en `angular.json` para que `environment.prod.ts` realmente reemplace al de dev en build de producción (bug pre-existente: el flag `production` y el DSN de Sentry nunca llegaban al bundle).

---

## [1.0.11] — 2026-04-25

### Added
- Clon de visita en estado `en_cola` sin pedir fechas (mantiene la cola sin programar).

### Fixed
- Auto-fix de fechas inconsistentes (fecha_fin <= fecha_inicio) al cargar visita en form.

---

## [1.0.10] — 2026-04-23

### Added
- Modal de clonar visita con preselección inteligente de fechas (próximo slot de 30 min).

---

## [1.0.9] — 2026-04-22

### Changed
- **Responsive mobile pass**: ajustes de breakpoints, navegación lateral colapsable en mobile.

---

## [1.0.8] — 2026-04-22

### Changed
- Rename de dominio `tipo_visita` → `actividad` (código + DB migración 010).

---

## [1.0.7] — 2026-04-22

### Changed
- Rename de dominio `actividades` → `visitas` (código + DB migración 009).

### Fixed
- Migración 009 saltea identity policy renames (src == dst).

---

## [1.0.6] — 2026-04-21

### Added
- Auto-recovery ante chunks lazy faltantes post-deploy (`ChunkReloadErrorHandler`).

### Changed
- Paleta pastel + sort por horario + reorden columnas.
- Fecha_fin pasa a ser obligatoria.

---

## [1.0.5] — 2026-04-21

### Added
- Separador de días en lista de visitas.
- Multi-asignación de técnicos y tipos en una visita (migración 008).
- Chips uniformes para representar técnicos/tipos.

### Fixed
- Desambiguación de FK en SELECT (tecnico/tipo_actividad).

---

## [1.0.4] — 2026-04-20

### Added
- **Security hardening**: tipos de usuario + RLS endurecida (migración 007).
- Permisos en UI con directiva `*appSiTiene`.

### Fixed
- CSP permite Vercel preview (`vercel.live`), fuentes https y Supabase realtime.

---

## [1.0.0 — 1.0.3]

Releases iniciales del MVP. Ver `git log` para detalles.
