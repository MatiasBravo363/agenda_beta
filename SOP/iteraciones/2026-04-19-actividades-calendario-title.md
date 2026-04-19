# Iteración: Actividades/Calendario — Título simplificado
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
Los bloques del calendario deben mostrar únicamente: rango horario, cliente y técnico.

## Criterios de aceptación
- [ ] Title de cada evento = `HH:mm-HH:mm · cliente · técnico`.
- [ ] Si no hay fecha_fin, muestra sólo `HH:mm · cliente · técnico`.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (title = `HH:mm-HH:mm · cliente · técnico` en `toEvents`)
