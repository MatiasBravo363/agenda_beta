# Iteración: Actividades — 5 cards por estado + semana actual por defecto
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
- Reemplazar las 2 spotlight cards actuales por **5 cards**, una por cada estado de actividad (en_cola, coordinado_con_cliente, agendado_con_tecnico, visita_fallida, completada). Cada card con el color del estado.
- En Lista, al entrar a la pantalla, los filtros de fecha (`desde`/`hasta`) se inicializan y aplican con la **semana actual** (lunes a domingo).

## Criterios de aceptación
- [ ] `/actividades` y `/actividades/calendario` muestran grid de 5 spotlight cards (una por estado).
- [ ] Cada card usa `colorDeEstado` para glow y accent.
- [ ] SpotlightCardComponent soporta `[customColor]` además de los tones predefinidos.
- [ ] Lista: al cargar, `pendiente.desde` = lunes de la semana actual (00:00) y `pendiente.hasta` = domingo (23:59); `aplicarFiltros()` se invoca inmediatamente para que la tabla ya arranque filtrada.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/core/utils/estado.util.ts` (helper `colorDeEstado(estado)`)
- `agenda-beta/src/app/shared/components/spotlight-card.component.ts` (input `customColor` + helper hex→rgba)
- `agenda-beta/src/app/features/activities/activities-list.component.ts` (grid 5 cards por estado con customColor; `kpiPorEstado` computed; default semana actual en `ngOnInit` via `setRangoSemanaActual()` + `aplicarFiltros()`)
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (grid 5 cards por estado; `kpiPorEstado` computed)
