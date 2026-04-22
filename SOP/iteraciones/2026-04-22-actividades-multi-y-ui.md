# Iteración: Actividades — separador de días + multi-asignación + chips uniformes
Fecha: 2026-04-22
Estado: esperando revisión

## Requerimiento
Cuatro mejoras sobre el módulo actividades:
1. Separador visual entre grupos de día en la lista: más destacado (barra + línea gruesa + texto más grande + más padding).
2. Una actividad debe poder tener **varios técnicos** asignados (hoy FK simple).
3. Una actividad debe poder tener **varios tipos de actividad** asignados (hoy FK simple).
4. Chips de estado en la tabla con ancho uniforme.

Bonus: bump de versión a `1.0.5` (se muestra en el sidebar, leído de `package.json`).

## Criterios de aceptación
- [ ] Separador de día se ve con línea gruesa color marca, texto más grande (no uppercase), padding vertical aumentado.
- [ ] En el formulario se pueden seleccionar varios técnicos y varios tipos de actividad (multi-select).
- [ ] En la lista se ven todos los técnicos y tipos asociados a cada actividad.
- [ ] Al guardar/editar, los pivotes `actividad_tecnicos` y `actividad_tipos_actividad` persisten los cambios.
- [ ] Los chips de estado tienen todos el mismo ancho (no varían según el largo del texto).
- [ ] El sidebar muestra `V1.0.5`.
- [ ] Compila sin errores (`npx ng build --configuration=development`).
- [ ] Datos existentes (actividades con un único técnico/tipo) se siguen viendo correctamente (backfill desde FKs simples a pivotes).

## Notas visuales / referencias
- Separador: estilo barra destacada (ver plan `actividades-en-lista-jazzy-pinwheel.md`).
- Multi-select custom propio con chips (sin librerías externas — bundle limit 500 kB).
- `.chip-estado`: `min-w-[10.5rem]` + `justify-center` (largo suficiente para `"Coordinado con cliente"`).

## Prioridad
obligatoria

## Archivos modificados

**Creados:**
- [agenda-beta/supabase/migrations/008_actividades_multi_asignacion.sql](../../agenda-beta/supabase/migrations/008_actividades_multi_asignacion.sql)
- [agenda-beta/src/app/shared/components/multi-select.component.ts](../../agenda-beta/src/app/shared/components/multi-select.component.ts)

**Editados:**
- [agenda-beta/src/app/core/models/index.ts](../../agenda-beta/src/app/core/models/index.ts) — extendido `Actividad` con `tecnicos`, `tipos_actividad`, `tecnicos_ids`, `tipos_actividad_ids`.
- [agenda-beta/src/app/core/services/activities.service.ts](../../agenda-beta/src/app/core/services/activities.service.ts) — joins anidados a pivotes, mapper `flattenRels`, `syncPivote` helper, create/update/clone actualizados.
- [agenda-beta/src/app/features/activities/activity-form.component.ts](../../agenda-beta/src/app/features/activities/activity-form.component.ts) — `<select>` single reemplazado por `<app-multi-select>` (técnicos y tipos), nueva validación.
- [agenda-beta/src/app/features/activities/activities-list.component.ts](../../agenda-beta/src/app/features/activities/activities-list.component.ts) — separador de día destacado (`border-t-4 border-brand-500`, `py-4`, `text-sm`), chip de estado con `chip-estado`, columna tipo muestra chips múltiples.
- [agenda-beta/src/styles.css](../../agenda-beta/src/styles.css) — agregado `.chip-estado` (`min-w-[10.5rem] justify-center text-center`).
- [agenda-beta/package.json](../../agenda-beta/package.json) — version bump `1.0.4` → `1.0.5` (se refleja en el sidebar).

## Cómo probar

1. **Migración**: aplicar `008_actividades_multi_asignacion.sql` en el dashboard de Supabase (SQL Editor). Luego:
   ```sql
   select count(*) from actividad_tecnicos;
   select count(*) from actividad_tipos_actividad;
   ```
   Deben coincidir con la cantidad de actividades que tenían técnico/tipo no null.

2. **Dev server**: desde `agenda-beta/` correr `npm start` y abrir http://localhost:4200/actividades/lista.
   - Verificar que el sidebar muestra `V1.0.5`.
   - Separador de día: línea gruesa color marca, texto más grande, más padding.
   - Chips de estado: todos el mismo ancho.
   - Crear actividad nueva con 2+ técnicos y 2+ tipos → se listan correctamente.
   - Editar: abrir una actividad, cambiar selección, guardar, verificar persistencia.

## Scope no incluido (pendiente para próxima iteración)
- Calendar, dashboard, exports y filtros de lista por técnico/tipo siguen usando los FKs "principales" (primer elemento del pivote). Funcionan pero no contemplan multi-asignación en vistas agregadas.

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
