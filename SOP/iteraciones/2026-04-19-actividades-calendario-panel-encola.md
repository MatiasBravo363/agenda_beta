# Iteración: Actividades/Calendario — Panel "En cola" con drag & drop al calendario
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
En la vista calendario, agregar un panel lateral izquierdo que:
1. Lista las actividades con `estado === 'en_cola'` como cards.
2. Permite crear una actividad nueva en cola (cliente + tipo obligatorios; técnico + ubicación opcionales).
3. Arrastrable: al soltar una card sobre el calendario, abre un modal para elegir el nuevo estado y setear fecha_inicio/fecha_fin, luego persiste.

## Criterios de aceptación
- [ ] Panel izquierdo en la misma página de calendario, ancho fijo (~280px).
- [ ] Cards por default muestran `Cliente — Técnico`.
- [ ] Hover/expand muestra adicionalmente Tipo + Estado (chip).
- [ ] Form inline arriba del listado con campos: cliente (req), tipo (req), técnico (opc), ubicación (opc). Botón "Crear en cola".
- [ ] Cada card es arrastrable y al soltar en una celda de tiempo del calendario, abre modal:
  - Select de nuevo estado (ESTADOS sin "en_cola").
  - Input opcional de duración (default 60 min).
  - Al confirmar: update DB con `fecha_inicio=dropDate`, `fecha_fin=dropDate+dur`, `estado=elegido`. Reload.
  - Cancel → no persiste.
- [ ] La card desaparece del panel al confirmar (ya no es en_cola).

## Notas técnicas
- Usar `Draggable` de `@fullcalendar/interaction` para marcar las cards externas. Sin clase `fc-event` para que FullCalendar no cree el evento automáticamente y nosotros controlemos el flujo vía `drop` callback.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (panel aside con form crear + lista en_cola, cards con hover-expand, `Draggable` de @fullcalendar/interaction, `drop` handler que abre modal con select de estado y duración antes de persistir)
