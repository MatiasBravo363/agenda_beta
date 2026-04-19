# Iteración: Calendario — Click/drag en celdas para crear actividad
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
En vistas de día/semana del calendario, permitir al usuario seleccionar un rango horario con click simple o click+drag. Al soltar, abrir el formulario de nueva actividad con fecha_inicio y fecha_fin precargadas.

## Criterios de aceptación
- [ ] `selectable: true` y `selectMirror: true` en FullCalendar.
- [ ] Handler `select` que navega a `/actividades/nueva?start=ISO&end=ISO`.
- [ ] `ActivityFormComponent` lee `queryParamMap` en modo "nueva" y precarga fecha_inicio/fecha_fin.
- [ ] Click simple crea un rango default (slot de 30 min).
- [ ] Click+drag arma el rango arrastrado.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (`selectable`, `selectMirror`, handler `select` → navigate con queryParams)
- `agenda-beta/src/app/features/activities/activity-form.component.ts` (lee `start`/`end` de queryParams en modo "nueva")
