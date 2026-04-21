# Iteración: Actividades — Mini-calendario, horario, modal de edición
Fecha: 2026-04-21
Estado: esperando revisión

## Requerimiento
Transformar la vista de lista de actividades en una agenda al estilo Google Calendar (agrupada por día con mini-calendario lateral) y permitir edición por modal tanto desde la lista como desde el calendario, reutilizando el form existente.

## Criterios de aceptación
- [x] Columna "Horario" en la tabla, a la derecha de "Fecha creación", mostrando `fecha_inicio` como `HH:mm` (o `—`).
- [x] Mini-calendario mensual a la izquierda de la tabla, con puntos en días con actividades, navegación mes anterior/siguiente, y click para filtrar la tabla por ese día.
- [x] Tabla agrupada por día (estilo agenda Google Calendar) con fila separadora fuerte por grupo, registros sin fecha al final bajo "Sin fecha".
- [x] Click en el chip de estado abre un modal sobre la lista con el form completo para editar la actividad (sin cambiar de módulo).
- [x] Click en evento del calendario abre el mismo modal sobre la vista calendario, en lugar de navegar a `/actividades/:id`.

## Notas visuales / referencias
- Agenda estilo Google Calendar (fila separadora por día).
- Overlay `fixed inset-0 bg-slate-900/50` + `card` centrada como en los modales existentes del calendario.
- Respeta dark mode con tokens `dark:`.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/activities/activity-form.component.ts` — `@Input() idEmbed`, `@Output() guardado`/`cancelado`, botón cancelar en modo embed, skip router.navigate cuando embebido.
- `agenda-beta/src/app/features/activities/activities-list.component.ts` — layout grid con mini-calendario, nueva columna Horario, sort por horario, agrupación `gruposPorDia`, signals `diaSeleccionado`/`editandoId`/`mesVisible`, modal con `<app-activity-form>` embebido, chip de estado como botón.
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` — `editandoId` signal + modal con `<app-activity-form>` embebido; `eventClick` ahora abre modal en lugar de `router.navigate`.

## Mejora aplicada (tras revisión)
_(pendiente)_
