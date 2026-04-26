# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- [agenda-beta/](agenda-beta/) — Angular 21 app (the actual product). All npm/ng commands must be run from here.
- [agenda-beta/supabase/](agenda-beta/supabase/) — `migrations/` (`001_init.sql` … `010_rename_tipos_visita_a_actividades.sql`) and `seed.sql`. No Supabase CLI project linked; migrations are applied manually in the Supabase dashboard.
- [SOP/](SOP/) — Standard operating procedures. [SOP/CLAUDE.md](SOP/CLAUDE.md) defines the senior-dev agent role; [SOP/iteraciones/](SOP/iteraciones/) logs each `/modulo` iteration (`YYYY-MM-DD-<modulo>.md`).
- [.claude/skills/](.claude/skills/) and [.agents/skills/](.agents/skills/) — project-scoped skills, including `/modulo` (the main iteration workflow).

## Commands (run inside [agenda-beta/](agenda-beta/))

- `npm start` — dev server (`ng serve`, default http://localhost:4200).
- `npm run build` — production build. Output: `dist/agenda-beta/browser` (consumed by Vercel, see [agenda-beta/vercel.json](agenda-beta/vercel.json)).
- `npm run watch` — dev build in watch mode.
- `npm test` — Angular unit tests via `@angular/build:unit-test` (vitest + jsdom).

There is no lint script. Prettier is installed but has no wrapper script — invoke with `npx prettier` if needed.

## Stack

Angular 21 standalone components with **signals** (zoneless) + Tailwind 3 + FullCalendar 6 + ECharts via `ngx-echarts` (lazy-loaded; see commit `4394cb1` — importing echarts eagerly blows the 500 kB initial bundle budget configured in [agenda-beta/angular.json](agenda-beta/angular.json)) + `@supabase/supabase-js` + `exceljs` + `file-saver` for XLSX exports. Deployed to Vercel as a SPA (rewrite all routes to `index.html`).

## Architecture

Routing is declared in [agenda-beta/src/app/app.routes.ts](agenda-beta/src/app/app.routes.ts). Everything behind `authGuard` renders inside `MainLayoutComponent` (sidebar + content). Auth routes (`login`, `reset-password`) use `publicGuard`. Root redirects to `/visitas/lista`. Los paths antiguos `/actividades*` y `/tipos-actividad` siguen funcionando vía redirects.

Code is organized as:

- [agenda-beta/src/app/core/](agenda-beta/src/app/core/) — cross-cutting concerns
  - `auth/` — guards + auth service backed by Supabase Auth (email/password).
  - `supabase/` — single `SupabaseService` wrapper; feature services consume it with async/await.
  - `services/` — one service per domain table (`visitas`, `actividades`, `technicians`, `users`, `history`, `permisos`, `tipos-usuario`).
  - `models/index.ts` — **all TS domain types live here** (single barrel): `Visita`, `VisitaHistorial`, `Actividad`, `EstadoVisita`, `Tecnico`, `Usuario`, `TipoUsuario`, `Permiso`, `PermisoCodigo`.
  - `utils/estado.util.ts` — **source of truth for visit state labels and colors.** See business rule below.
  - `error/chunk-reload.handler.ts` — global `ErrorHandler` que auto-reloadea ante "Failed to fetch dynamically imported module" post-deploy.
  - `theme/` — dark mode handling.
- [agenda-beta/src/app/features/](agenda-beta/src/app/features/) — one folder per top-level route: `visitas`, `actividades`, `auth`, `configuracion`, `dashboard`, `history`, `technicians`, `tipos-usuario`, `users`. Components are lazy-loaded via `loadComponent`/`loadChildren`.
- [agenda-beta/src/app/shared/](agenda-beta/src/app/shared/) — `layouts/main-layout.component.ts` y reusable `components/` (incluye `multi-select.component.ts` y `direccion-autocomplete.component.ts`).

## Business rules that shape the code

From [`project_agenda_beta`](../../.claude/projects/.../memory/project_agenda_beta.md) memory and the actual domain logic:

- **Permissions are code-based, enforced in two layers.** Routes are gated with `permisoGuard('<codigo>')` (see [agenda-beta/src/app/core/auth/permiso.guard.ts](agenda-beta/src/app/core/auth/permiso.guard.ts)); the DB enforces the same via RLS policies tied to `tipos_usuario` (migration `007`). Use existing codes (`visitas.ver`, `actividades.ver`, `tipos_usuario.gestionar`, …) — do not invent ad-hoc checks in components.
- **Dominio bi-nivel: `visita` (registro) y `actividad` (categoría/tipo de tarea).** Tras migraciones 009+010: tablas DB `visitas`, `visitas_historial`, `actividades`, `visita_tecnicos`, `visita_actividades`. Interfaces TS: `Visita`, `Actividad`, `VisitaHistorial`, `EstadoVisita`. Bookmarks viejos `/actividades/{lista,calendario,nueva,:id}` redirigen a `/visitas/*`; `/tipos-actividad` y `/tipos-visita` redirigen a `/actividades`.
- **Visit state → color is derived in the front end**, never stored in DB. All derivation goes through [agenda-beta/src/app/core/utils/estado.util.ts](agenda-beta/src/app/core/utils/estado.util.ts) (`colorDeEstado`, `colorDeVisita`, `ESTADO_LABEL`, `ESTADOS`). When adding a new state, update this file first.
- **Cloning a failed visit** uses `parent_visita_id` on the visita (ver [visitas.service.ts](agenda-beta/src/app/core/services/visitas.service.ts) `clone()`). Preserve this field on clone flows.
- **Una visita puede tener múltiples técnicos y múltiples actividades** vía pivotes `visita_tecnicos` y `visita_actividades` (migración 008, renombrada en 010). Los FKs simples `tecnico_id` y `actividad_id` en `visitas` se mantienen como "principal" (primer elemento del array) para retrocompat con vistas legacy (calendar, dashboard, exports).
- **Technician has `tecnico_bermann` (internal/external) and `region` flags** — both feed into visibility rules en lists/calendar.

## Conventions

- **Standalone components + signals.** New components should not use NgModules and should prefer `signal`/`computed`/`effect` over RxJS when state is local.
- **Tailwind utility classes defined globally** in [agenda-beta/src/styles.css](agenda-beta/src/styles.css): `btn-primary`, `btn-secondary`, `card`, `input`, `label`, `chip`. Reuse these instead of ad-hoc styles.
- **Services are async/await**, not Observable-first, when talking to Supabase.
- **Lazy-load heavy deps** (echarts, fullcalendar plugins) to stay under the 500 kB initial budget.

## Iteration workflow

New features go through the `/modulo` skill (see [.claude/skills/modulo/SKILL.md](.claude/skills/modulo/SKILL.md)):

- `/modulo <nombre>` — capture requirements → implement → leave ready for user review.
- `/modulo revisar` — apply feedback on the last iteration.

Each run appends a log to [SOP/iteraciones/](SOP/iteraciones/). Read the latest file there before starting related work to avoid re-litigating decisions.
