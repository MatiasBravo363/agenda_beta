# Iteración: Actividades/Calendario — Mejoras tipo Google Calendar
Fecha: 2026-04-18
Estado: esperando revisión

## Requerimiento
Mejorar el aspecto y funcionalidad del calendario (hoy FullCalendar v6) para acercarlo a la experiencia de Google Calendar: más vistas, filtros, drag & drop de eventos, y feedback visual mejorado.

## Criterios de aceptación
- [ ] Agregar vista **Día** (`timeGridDay`) al conjunto existente (mes/semana/lista).
- [ ] Filtros dropdown arriba del calendario: por técnico, por estado, por tipo de actividad.
- [ ] Drag & drop para reubicar eventos (actualiza fecha_inicio/fecha_fin en DB).
- [ ] Resize de eventos para ajustar duración.
- [ ] Indicador "hora actual" (nowIndicator: true).
- [ ] Leyenda de colores visible (reusando `colorDeActividad`).

## Notas visuales / referencias
FullCalendar ya está instalado. Se aprovecha `editable: true`, `eventDrop`, `eventResize`. No se reemplaza la lib.

## Prioridad
deseable (mejora sobre funcional existente)

## Archivos modificados
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (filtros técnico/estado/tipo, vista día, drag+resize con persistencia, nowIndicator, toast feedback, initialView = timeGridWeek)

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
