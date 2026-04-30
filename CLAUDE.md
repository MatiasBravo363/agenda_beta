# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- [agenda-beta/](agenda-beta/) — Angular 21 app (the actual product). All `npm`/`ng` commands must be run from here.
- [agenda-beta/supabase/migrations/](agenda-beta/supabase/migrations/) — `001_init.sql` … `019_schema_version_backfill.sql`. No Supabase CLI project linked; migrations are applied **manually** in the Supabase dashboard, in order. `public.schema_version` (table from migration 014) is the source of truth for what's been applied; each new migration must insert its row.
- [SOP/](SOP/) — Standard operating procedures. [SOP/OPERACION.md](SOP/OPERACION.md) is the deploy/incident runbook. [SOP/iteraciones/](SOP/iteraciones/) logs each `/modulo` iteration as `YYYY-MM-DD-<modulo>.md`.
- [CHANGELOG.md](CHANGELOG.md) — Keep a Changelog format. Update on every release.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) — runs lint + test + build in parallel on every PR and push to main.

## Commands (run inside [agenda-beta/](agenda-beta/))

- `npm start` — dev server (`ng serve`, default http://localhost:4200).
- `npm run build` — production build. Triggers `postbuild` script that uploads source maps to Sentry (tolerant to failures since 1.0.16; missing/invalid `SENTRY_AUTH_TOKEN` logs a warning but doesn't block the deploy).
- `npm run watch` — dev build in watch mode.
- `npm test` — vitest + jsdom via `@angular/build:unit-test`. Run a single spec with `npx vitest run path/to/file.spec.ts`.
- `npm run lint` / `npm run lint:fix` — ESLint flat config ([eslint.config.js](agenda-beta/eslint.config.js)) with angular-eslint v21 + typescript-eslint v8. Many a11y warnings tolerated; CI gates on errors only.
- `npm run format` — Prettier on `src/**/*.{ts,html,json,css,scss}`.

Husky pre-commit is **opt-in**: activate with `git config core.hooksPath .husky` if you want lint-staged on commit.

## Stack

Angular 21 standalone components with **signals** (zoneless) + Tailwind 3 + FullCalendar 6 + ECharts via `ngx-echarts` (partial-import — see critical convention below) + `@supabase/supabase-js` + `exceljs` + `file-saver` for XLSX exports + `@sentry/angular` + Vercel Analytics + Speed Insights (production only). Deployed to Vercel as a SPA (rewrite all routes to `index.html`, see [agenda-beta/vercel.json](agenda-beta/vercel.json)).

Bundle warning budget is **650 kB initial** ([angular.json](agenda-beta/angular.json)); current size hovers around 615 kB. Heavy deps must stay lazy-loaded.

## Architecture

Routing is declared in [agenda-beta/src/app/app.routes.ts](agenda-beta/src/app/app.routes.ts). Public routes (`/login`, `/reset-password`, `/status`, `/sin-permisos`) live at the top level. Everything else is nested under a `path: ''` route protected by `authGuard` and rendered inside `MainLayoutComponent`. Root redirects to `/visitas/lista`. Legacy paths `/actividades*` and `/tipos-actividad` redirect to their current locations.

Code is organized as:

- [agenda-beta/src/app/core/](agenda-beta/src/app/core/) — cross-cutting concerns
  - `auth/` — `authGuard`, `publicGuard`, `permisoGuard(codigo)`. Auth backed by Supabase Auth (email/password).
  - `supabase/` — single `SupabaseService` wrapper; feature services consume it with async/await.
  - `services/` — one service per domain table (`visitas`, `actividades`, `technicians`, `users`, `permisos`, `tipos-usuario`, `feature-flags`). El service de `history` fue removido en 1.0.20; la tabla `visitas_historial` sigue activa por trigger 017 para auditoría.
  - `models/index.ts` — **all TS domain types live here** (single barrel): `Visita`, `VisitaHistorial`, `Actividad`, `EstadoVisita`, `Tecnico`, `Usuario`, `TipoUsuario`, `Permiso`, `PermisoCodigo`.
  - `utils/estado.util.ts` — **source of truth for visit state labels and colors.** See business rules.
  - `error/` — `SentryAwareErrorHandler` wraps `ChunkReloadErrorHandler`. The latter auto-reloads on `Failed to fetch dynamically imported module` (post-deploy chunk hash mismatch). The former forwards everything else to Sentry.
  - `theme/` — dark mode handling (`isDark` signal, persisted to localStorage).
- [agenda-beta/src/app/features/](agenda-beta/src/app/features/) — one folder per top-level route. All components lazy-loaded via `loadComponent`/`loadChildren`.
- [agenda-beta/src/app/shared/](agenda-beta/src/app/shared/) — layouts + reusable components (`multi-select`, `direccion-autocomplete`, `skeleton`, `spotlight-card`, `visita-clonar-modal`) + directives (`*appSiTiene`, `*appFeature`, `appFocusTrap`).

## Business rules that shape the code

- **Permissions are code-based, enforced in three layers.** (1) Routes are gated with `permisoGuard('codigo.ver')` in [app.routes.ts](agenda-beta/src/app/app.routes.ts) — every authenticated route except `/` redirect has one. (2) Sidebar menu items use `*appSiTiene='codigo.ver'` ([main-layout.component.ts](agenda-beta/src/app/shared/layouts/main-layout.component.ts)). (3) DB enforces via RLS policies tied to `tipos_usuario` (migration 007). The `permisoGuard` falls **closed** — failure to load permisos within 5 s redirects to `/sin-permisos` (a public route that breaks the redirect loop with `/visitas`). Convention: every `*appSiTiene='X'` item in the sidebar **must** have its route gated with `permisoGuard('X')` using the exact same code. The spec [app.routes.spec.ts](agenda-beta/src/app/app.routes.spec.ts) enforces this.
- **Dominio bi-nivel: `visita` (registro) y `actividad` (categoría / tipo de tarea).** DB tables: `visitas`, `visitas_historial`, `actividades`, `visita_tecnicos`, `visita_actividades`. Una visita puede tener múltiples técnicos y múltiples actividades vía pivotes (migración 012 restringió RLS de pivotes a creador o super_admin). Los FKs simples `tecnico_id` y `actividad_id` en `visitas` se mantienen como "principal" (primer elemento del array) para retrocompat con vistas legacy.
- **Visit state → color is derived in the front end**, never stored in DB. All derivation goes through [estado.util.ts](agenda-beta/src/app/core/utils/estado.util.ts) (`colorDeEstado`, `colorDeVisita`, `ESTADO_LABEL`, `ESTADOS`). When adding a new state, update this file first.
- **Optimistic locking on `visitas.update()`** (migración 015 + service): the client must send the `updated_at` it last read; if DB's current value differs, the trigger raises `ERRCODE 40001`. The service translates that to `ConflictoVisitaError` ([visitas.service.ts](agenda-beta/src/app/core/services/visitas.service.ts)); the form catches it and offers a reload. Super-admin bypasses this check.
- **State transitions** se controlan desde el form Angular vía `visitas.editar` (1.0.18+). El trigger 013 que bloqueaba `en_cola → completada` y `completada → otros` fue **removido en migración 020** (1.0.18). Hoy cualquier usuario con `visitas.editar` puede hacer cualquier transición — el permiso es el único gate. Las validaciones de coherencia (estado↔técnico) están en el form (`save()`), no en DB.
- **RLS de pivotes** (`visita_tecnicos` y `visita_actividades`) abierta a `authenticated` para INSERT/UPDATE/DELETE desde **migración 021** (1.0.19). Antes (mig. 012) requería ser creador o super_admin — bloqueaba a coordinadores editando visitas ajenas. Mismo gate-único que el resto de la edición: `visitas.editar` a nivel form.
- **Audit log via trigger** (migración 017): every INSERT/UPDATE on `visitas` writes to `visitas_historial` with a `cambios jsonb` delta of relevant fields (`estado`, fechas, `tecnico_id`, `actividad_id`, `nombre_cliente`, `descripcion`, `ubicacion`).
- **Cloning a failed visit** uses `parent_visita_id` (`visitas.service.ts` `clone()`). Preserve this field on clone flows so the lineage stays auditable.
- **Date filter expansion** (`expandirInicioDia` / `expandirFinDia` in [visitas.service.ts](agenda-beta/src/app/core/services/visitas.service.ts)): when `listPaged({hasta: 'YYYY-MM-DD'})` is called, the service expands `hasta` to `YYYY-MM-DD 23:59:59.999` so the day is included. Without this, Postgres treats `'YYYY-MM-DD'` as midnight and excludes the whole day.
- **Feature flags** (table `feature_flags`, migración 018) + `FeatureFlagsService` + `*appFeature='key'` directive. Use sparingly; flags should default closed and be removed once the feature is stable.
- **Technician has `tecnico_bermann` (internal/external) and `region` flags** — both feed into visibility rules in lists/calendar.

## Conventions and gotchas

- **Standalone components + signals.** New components should not use NgModules and should prefer `signal`/`computed`/`effect` over RxJS when state is local.
- **Tailwind utility classes** defined globally in [styles.css](agenda-beta/src/styles.css): `btn-primary`, `btn-secondary`, `btn-danger`, `card`, `input`, `label`, `chip`, `chip-estado`. Reuse these instead of ad-hoc styles.
- **Services use async/await**, not Observable-first, when talking to Supabase.
- **Echarts partial-import — register chart types in `dashboard.routes.ts`.** [dashboard.routes.ts](agenda-beta/src/app/features/dashboard/dashboard.routes.ts) calls `echarts.use([...])` with an explicit list of chart types and components. **If you add a chart of a new type (`pie`, `bar`, `heatmap`, `funnel`, etc.) without registering it here, echarts ignores it silently** — no warning, no error, the chart just doesn't render. Same for components like `VisualMapComponent`, `GraphicComponent`. This bit us across 1.0.14–1.0.16; the file has a comment block warning future devs.
- **Lazy-load heavy deps** (echarts, fullcalendar plugins, exceljs) to stay under the 650 kB initial budget. Echarts and fullcalendar are imported only inside their feature routes.
- **Bumping the version**: update **both** [package.json](agenda-beta/package.json) `version` AND [sentry.init.ts](agenda-beta/src/app/core/error/sentry.init.ts) `APP_VERSION` in the same commit. The sidebar reads `package.json#version`; Sentry uses `APP_VERSION` for releases. They must match.
- **Sentry source maps** uploaded by [scripts/upload-sourcemaps.sh](agenda-beta/scripts/upload-sourcemaps.sh) in `postbuild`. Tolerant to failures (logs warning, exits 0). If you see ofuscated stack traces in Sentry, the token is probably stale — rotate it in Sentry settings and update Vercel env var `SENTRY_AUTH_TOKEN`.

## Iteration workflow

New features go through the `/modulo` skill (see [.claude/skills/modulo/SKILL.md](.claude/skills/modulo/SKILL.md)):

- `/modulo <nombre>` — capture requirements → implement → leave ready for user review.
- `/modulo revisar` — apply feedback on the last iteration.

Each run appends a log to [SOP/iteraciones/](SOP/iteraciones/). Read the latest file there before starting related work to avoid re-litigating decisions.

Branch naming for releases: `beta-X.Y.Z` from `main`, PR back to `main`. Each release bumps version, updates CHANGELOG, and ideally has its iteration log in `SOP/iteraciones/`.
