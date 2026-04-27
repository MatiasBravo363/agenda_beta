# Changelog

Todos los cambios notables del proyecto se documentan acá.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Semantic Versioning](https://semver.org/lang/es/).

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
