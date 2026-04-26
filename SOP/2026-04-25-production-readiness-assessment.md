# Production-Readiness Assessment — Agenda_BETA

**Fecha:** 2026-04-25  **Versión auditada:** 1.0.11 (`beta-1.0.11`)
**Alcance:** seguridad, calidad de software, arquitectura/escalabilidad, observabilidad, análisis funcional/UX.

---

## 1. Veredicto ejecutivo

> **NO APTO para producción multi-usuario sin remediación previa.** El producto es funcionalmente sólido y la UX está pulida (MVP completo), pero hay **bloqueadores críticos en seguridad, observabilidad y escalabilidad** que comprometen la confianza, la operabilidad y la capacidad de diagnóstico ante incidentes.

**Score global de readiness: 45/100**

| Área | Score | Estado |
|---|---|---|
| Funcional / UX | 80/100 | Apto con ajustes menores |
| Seguridad | 50/100 | Bloqueadores críticos en RLS y guard de permisos |
| Calidad de software | 35/100 | Sin tests, manejo de errores inconsistente |
| Arquitectura / escalabilidad | 45/100 | Sin paginación ni cache; OK hasta ~3-5k visitas |
| Observabilidad / operación | 15/100 | Ciegos en producción: sin error tracking, sin logs, sin alertas |

**Capacidad estimada actual:** ~3-5k visitas, ~20 usuarios concurrentes en buen funcionamiento. Más allá: degradación severa.

---

## 2. Diagnóstico por área

### 2.1 Seguridad

**🔴 Críticos**
1. **RLS sobrepermisivo en pivotes** ([supabase/migrations/008_actividades_multi_asignacion.sql:54-69](agenda-beta/supabase/migrations/008_actividades_multi_asignacion.sql)): políticas `with check (true)` permiten a cualquier autenticado modificar asignaciones técnico↔visita ajenas.
2. **`permisoGuard` con `setTimeout(300ms)`** ([core/auth/permiso.guard.ts](agenda-beta/src/app/core/auth/permiso.guard.ts:11-13)): si `PermisosService.cargar()` falla silenciosamente, el guard deja pasar al usuario sin permisos reales.
3. **Sin validación de transiciones de estado en backend**: el flujo de estados (`en_cola → completada` saltando etapas) solo está protegido en UI; un cliente API directo puede saltarse la lógica.

**🟠 Altos**
4. **Migración 007 sin verificación de aplicación**: si quedó parcial, las políticas omnibus `using (true)` de la migración 001 siguen activas.
5. **Invite de usuarios deja `tipo_usuario_id` opcional** ([core/services/users.service.ts:40-52](agenda-beta/src/app/core/services/users.service.ts)): usuarios invitados sin tipo quedan sin permisos hasta intervención manual.
6. **Tokens en `localStorage`** (default Supabase): cualquier XSS futuro = robo de sesión. CSP permite `unsafe-inline` en scripts.
7. **`npm audit`**: 2 vulnerabilidades moderate en `uuid <14` (transitiva vía exceljs).

### 2.2 Calidad de software

**🔴 Críticos**
1. **Cero tests unitarios en `src/`** (solo skeleton `app.spec.ts`). Vitest está configurado pero sin uso. Refactores ciegos.
2. **Manejo de errores inconsistente**: 48 try/catch con patrones divergentes; `try {} catch {}` silenciosos ([users.component.ts:213](agenda-beta/src/app/features/users/users.component.ts)); 1 `alert()` ([visitas-list.component.ts:499](agenda-beta/src/app/features/visitas/visitas-list.component.ts)); `service-error.util.ts` no se usa de forma uniforme.

**🟠 Altos**
3. **Componentes monolíticos**: `visitas-calendar` 680 LOC, `visitas-list` 542 LOC, `visita-form` 372 LOC — lógica de negocio mezclada con presentación.
4. **28 ocurrencias de `any` / `as any`** pese a `strict: true` (concentradas en `visitas.service.ts` y componentes de visitas).

**🟡 Medios**
5. **Sin lint configurado** (`.eslintrc` ausente, sin pre-commit hooks); `npm test` no corre lint.
6. **Sin CI/CD**: `.github/workflows/` no existe. Tests/build no se ejecutan en PR.
7. **Migraciones sin rollback documentado** (002, 005, 006, 010 no tienen DOWN).

### 2.3 Arquitectura y escalabilidad

**🔴 Críticos**
1. **Sin paginación en listas principales**: `VisitasService.list()`, `ActividadesService`, `UsersService`, `TechniciansService` traen el dataset completo. A 10k+ visitas → timeouts.
2. **Filtros 100% client-side**: dashboard y visitas-list descargan todo y filtran en memoria.
3. **Sin caché de queries**: cada navegación re-fetcha. Sin signal store ni invalidación.
4. **Sin optimistic locking**: dos usuarios editando la misma visita = last-write-wins silencioso (corrupción de datos).

**🟠 Altos**
5. **`SELECT_WITH_REL` eager** trae técnico+actividad+creador+pivotes en cada `list()` — N+1 visual y payload pesado.
6. **Faltan índices compuestos** (`fecha_inicio, estado, tecnico_id`) usados por dashboard. Sin índice en `parent_visita_id`.
7. **Bundle**: echarts + fullcalendar pesados; budget 500kB en angular.json en riesgo si dashboard/calendar no quedan lazy.

**Buenas prácticas presentes:** zoneless + signals correctamente aplicados, `provideZonelessChangeDetection()`, lazy-load por route, `effect()` con cleanup adecuado.

### 2.4 Observabilidad y operación

**🔴 Críticos** (toda la categoría)
1. **Sin error tracking**: cero Sentry/Rollbar/Datadog. Errores en prod desaparecen.
2. **`ChunkReloadErrorHandler` solo recarga chunks** — no reporta nada del resto de errores no capturados.
3. **Logging solo `console.*`** desactivado en prod; sin logging estructurado ni agregación.
4. **Sin métricas / analytics**: ciegos a uso, latencia, tasa de error, abandono.
5. **Sin health checks**: usuarios no distinguen "Supabase caído" de "mi internet".
6. **Sin alertas**: nadie se entera de un fallo hasta que un usuario lo reporta.
7. **Migraciones aplicadas a mano en dashboard Supabase**: drift inevitable entre dev/prod, sin trazabilidad de qué versión está aplicada dónde.
8. **Sin runbook operativo**: `SOP/` cubre desarrollo, no incidentes ni rollback.
9. **Sin feature flags**: bug en prod = revert + rebuild + redeploy (15-30 min).

**🟡 Parciales**
10. `visitas_historial` solo registra cambios de `estado` — no captura modificaciones de fechas, técnicos, descripción.
11. Versionado en `package.json` y commits, pero **sin CHANGELOG.md**.

### 2.5 Funcional / UX

**Estado: aceptable, con gaps acotados.**

✓ **Completo**: CRUD visitas + clonación inteligente, calendario drag-drop, multi-asignación técnicos/actividades, dashboard con KPIs, gestión de roles/permisos granular (23 permisos, directiva `*appSiTiene`), dark mode, responsive (release 1.0.9), validaciones reactivas de fechas, mensajes de error contextuales.

⚠️ **Gaps funcionales relevantes**:
- Sin confirmación al marcar visita como `completada` (sí al borrar).
- Validación de transiciones de estado solo en frontend (ver §2.1.3).
- Historial no audita cambios de fechas/técnicos/datos (solo estado).
- Export Excel solo en Actividades, falta en Visitas.
- Sin focus trap en modales (a11y); algunos `aria-*` faltantes.
- Hardcoded en español (irrelevante hoy, costoso si escala).

---

## 3. Plan de mejora priorizado

### P0 — Bloqueadores de producción (estimado: 7-10 días)

| # | Acción | Área | Esfuerzo |
|---|---|---|---|
| 1 | Restringir RLS de `actividad_tecnicos` y `actividad_tipos_actividad` (creador o super_admin) | Seguridad | 0.5d |
| 2 | Refactor `permisoGuard` a async/await + reintento explícito; falla cerrada si permisos no cargan | Seguridad | 0.5d |
| 3 | Validar transiciones de estado en DB (trigger o edge function) | Seguridad | 1d |
| 4 | Asignar `tipo_usuario_id` por defecto al invitar usuario (trigger `handle_new_user`) | Seguridad | 0.5d |
| 5 | Integrar Sentry (DSN público, 5kB gzip) en `app.config.ts` + `ErrorHandler` global | Observabilidad | 0.5d |
| 6 | Paginación server-side (`.range()`) en `VisitasService.list()` + filtros server-side | Escalabilidad | 2d |
| 7 | Tabla `schema_version` + script `apply-migrations.js` para trazabilidad de migraciones | Observabilidad | 1d |
| 8 | Runbook `SOP/OPERACION.md` (incidentes, rollback, escalation) | Operación | 0.5d |
| 9 | Tests unitarios mínimos en services Supabase (visitas, permisos, auth) — meta cobertura 40% en core | Calidad | 2d |
| 10 | Estandarizar manejo de errores: services lanzan, componentes usan `mensajeGenericoDeError()` + toast (eliminar `alert()` y `catch{}`) | Calidad | 1d |

### P1 — Pre-producción recomendado (estimado: 5-7 días)

| # | Acción | Área | Esfuerzo |
|---|---|---|---|
| 11 | Optimistic locking con `updated_at` check en `visitas.update()` + UI de conflicto | Arquitectura | 1d |
| 12 | Caché de queries con signal store + invalidación en mutations | Arquitectura | 1.5d |
| 13 | Índices compuestos: `(fecha_inicio, estado, tecnico_id)`, `parent_visita_id`, `created_by` | Performance | 0.5d |
| 14 | Confirmación explícita al marcar `completada` y al cambiar estado destructivo | Funcional | 0.5d |
| 15 | Extender `visitas_historial` a todos los campos relevantes (jsonb delta) | Compliance | 1d |
| 16 | CI GitHub Actions: lint + test + build en cada PR | Calidad | 0.5d |
| 17 | ESLint + pre-commit (lint-staged + husky) | Calidad | 0.5d |
| 18 | `npm audit fix` + revisión de dependencias | Seguridad | 0.5d |
| 19 | Vercel Analytics + tracking de eventos de negocio (visitas creadas, login) | Observabilidad | 0.5d |
| 20 | Página `/status` con heartbeat a Supabase | Observabilidad | 0.5d |

### P2 — Post-lanzamiento (estimado: 4-6 días)

| # | Acción | Área | Esfuerzo |
|---|---|---|---|
| 21 | Tabla `feature_flags` + helper para toggles en runtime | Operación | 1d |
| 22 | Refactor de componentes monolíticos (`visitas-calendar`, `visitas-list`) en sub-componentes + services | Calidad | 3d |
| 23 | Tipar `any` residuales (28 ocurrencias) | Calidad | 1d |
| 24 | Export Excel también en Visitas | Funcional | 0.5d |
| 25 | A11y: focus trap en modales, audit WCAG AA | UX | 1d |
| 26 | Skeleton loaders en transiciones | UX | 0.5d |
| 27 | CHANGELOG.md + automatización de release notes | Operación | 0.5d |

---

## 4. Roadmap recomendado

```
Semana 1-2  ──▶  P0 (bloqueadores: RLS, guard, observabilidad mínima, paginación)
Semana 3    ──▶  P1 parte 1 (optimistic lock, cache, CI, confirmaciones UX)
Semana 4    ──▶  P1 parte 2 + Beta cerrada con usuarios reales
Semana 5    ──▶  Soak + métricas; decisión Go/No-Go
Semana 6+   ──▶  P2 en iteraciones del workflow /modulo
```

**Hito de Go-Live mínimo:** completar P0 + P1 #11 (optimistic lock), #13 (índices), #18 (audit fix).

---

## 5. Riesgos abiertos a aceptar formalmente si se va a prod antes

Si el negocio exige acelerar, estos riesgos deben quedar **registrados y firmados**:

1. Sin observabilidad: cada bug en prod requiere reproducción manual; SLA de respuesta a incidentes degradado.
2. Sin tests: el costo marginal de cada cambio crece; alta probabilidad de regresiones silenciosas.
3. Sin paginación: capacidad efectiva ~3-5k visitas; se debe planificar reescritura antes de superarlo.
4. RLS de pivotes y validación de transiciones solo en frontend: usuarios técnicos podrían manipular datos vía consola.
5. Migraciones manuales: drift dev/prod inevitable; auditorías futuras costosas.
