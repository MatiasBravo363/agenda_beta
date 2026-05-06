# Iteración: tipo-usuario — borrar visitas ajenas + auditoría permisos (1.0.23)
Fecha: 2026-05-05
Estado: esperando revisión

## Requerimiento

1. **Activar la posibilidad de borrar visitas creadas por otros usuarios** mediante un permiso explícito (la hipótesis del usuario "no se pueden borrar visitas creadas por otra persona" se confirmó: la RLS de DELETE en `visitas` lo bloqueaba a no-creadores no super_admin, aunque tuvieran `visitas.borrar`).
2. **Auditar los nombres y descripciones del catálogo de permisos** porque las migraciones 009 y 010 renombraron códigos sin actualizar descripciones (ej: `visitas.ver` describía "Ver actividades").

## Criterios de aceptación

- [x] Existe el permiso `visitas.borrar_ajenas` con descripción "Borrar visitas creadas por otro usuario" en la tabla `permisos`.
- [x] El permiso queda asignado a `super_admin` por default (seed).
- [x] Los otros tipos (Administrador, Coordinador, Post venta) lo pueden marcar manualmente desde `/tipos-usuario`.
- [x] La RLS de DELETE en `visitas` se amplió: super_admin OR creador OR tiene `visitas.borrar_ajenas`.
- [x] El botón "Borrar" en `/visitas/lista` solo se renderiza cuando el click va a funcionar (combinación de `visitas.borrar` + ser creador / tener `visitas.borrar_ajenas`).
- [x] Las 9 descripciones desactualizadas se corrigieron (5 de visitas, 4 de actividades-catálogo).
- [x] Los permisos obsoletos `historial.ver` y `log.ver` se eliminaron del catálogo y del enum TS.
- [x] Helper SQL `tiene_permiso(codigo)` creado y reutilizable.
- [x] Build OK + lint sin errors.

## Notas visuales / referencias

- Botón "Borrar" en `visitas-list.component.ts` se condiciona ahora con `@if (puedeBorrar(a))` en lugar de `*appSiTiene`. La directiva sigue importada porque se usa en el botón "Exportar a Excel".
- Helper `tiene_permiso` sigue el patrón de `es_super_admin` (también `language sql stable security definer`) — consistente con la convención de mig 007.

## Prioridad

obligatoria

## Archivos modificados

- [agenda-beta/package.json](../../agenda-beta/package.json) — bump `1.0.22` → `1.0.23`.
- [agenda-beta/src/app/core/error/sentry.init.ts](../../agenda-beta/src/app/core/error/sentry.init.ts) — `APP_VERSION = '1.0.23'`.
- [agenda-beta/supabase/migrations/022_visitas_borrar_ajenas_y_descripciones.sql](../../agenda-beta/supabase/migrations/022_visitas_borrar_ajenas_y_descripciones.sql) — nuevo. Contiene helper, permiso nuevo + seed, RLS DELETE actualizada, UPDATE de 9 descripciones, DELETE de 2 obsoletos, schema_version 22.
- [agenda-beta/src/app/core/models/index.ts](../../agenda-beta/src/app/core/models/index.ts) — agregado `'visitas.borrar_ajenas'` al enum `PermisoCodigo`; quitados `'historial.ver'` y `'log.ver'`.
- [agenda-beta/src/app/features/visitas/visitas-list.component.ts](../../agenda-beta/src/app/features/visitas/visitas-list.component.ts) — inyectar `AuthService` + `PermisosService`, agregar método `puedeBorrar(v: Visita)`, reemplazar `*appSiTiene` del botón Borrar por `@if (puedeBorrar(a))`.
- [CHANGELOG.md](../../CHANGELOG.md) — entrada `[1.0.23] — 2026-05-05`.

## Configuración operativa pendiente (Dashboard Supabase NUEVO)

**Antes de mergear a `main`**, en el SQL Editor de `wwaqxpisuitimpdfuuhj`:

1. Pegar y correr el contenido de `agenda-beta/supabase/migrations/022_visitas_borrar_ajenas_y_descripciones.sql`.
2. Validar:
   ```sql
   SELECT version, name FROM public.schema_version ORDER BY version DESC LIMIT 5;
   -- esperado: 22 'visitas_borrar_ajenas_y_descripciones' como primer fila

   SELECT codigo, descripcion FROM public.permisos
    WHERE codigo IN ('visitas.borrar_ajenas','visitas.ver','actividades.ver','historial.ver','log.ver')
    ORDER BY codigo;
   -- esperado:
   --   actividades.ver       | Ver actividades (catálogo)
   --   visitas.borrar_ajenas | Borrar visitas creadas por otro usuario
   --   visitas.ver           | Ver visitas
   --   (historial.ver y log.ver no aparecen)
   ```
3. Después del deploy, asignar `visitas.borrar_ajenas` desde `/tipos-usuario` a los tipos que correspondan (Administrador, Coordinador) según la decisión del super_admin.

## Mejora aplicada (tras revisión)

_(se completa en Fase 3 si el usuario solicita ajustes)_
