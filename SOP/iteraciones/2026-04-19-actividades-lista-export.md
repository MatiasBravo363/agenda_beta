# Iteración: Actividades/Lista — ID, sort, estado coloreado, filtro fechas, export Excel
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
En la tabla de actividades:
- Primera columna `id` (primeros 8 chars, font-mono).
- Sort en todas las columnas.
- Estado como chip con el texto del estado pintado con su color.
- Filtro por rango de fechas (desde/hasta) sobre `fecha_inicio`.
- Botón "Exportar a Excel" que respeta filtros y sort.

## Criterios de aceptación
- [ ] Columna ID visible como primera columna, con tooltip del id completo.
- [ ] Sort asc/desc en id, cliente, técnico, tipo, estado, inicio, ubicación.
- [ ] Chip de estado coloreado usando `colorDeActividad`.
- [ ] Inputs date "desde" y "hasta" filtran por `fecha_inicio` (inclusive).
- [ ] Botón descarga `.xlsx` con las filas mostradas (post-filter, post-sort).

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/package.json` (+`xlsx`)
- `agenda-beta/src/app/features/activities/activities-list.component.ts` (columna ID, sort por 7 columnas, chip coloreado, filtros desde/hasta, botón Exportar a Excel con `filtradas()`)
