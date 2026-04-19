# Iteración: Calendario — Rango horario visible completo
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
Actualmente el calendario limita la grilla a 06:00-22:00. Permitir que se pueda revisar todo el día (0-24), manteniendo el foco inicial en 06:00 al abrir.

## Criterios de aceptación
- [ ] `slotMinTime: '00:00:00'`, `slotMaxTime: '24:00:00'`.
- [ ] `scrollTime: '06:00:00'` para que abra visualmente en esa hora.
- [ ] Se puede scrollear hacia horas nocturnas (22:00-06:00) sin que queden cortadas.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (slotMinTime=00:00, slotMaxTime=24:00, scrollTime=06:00)
