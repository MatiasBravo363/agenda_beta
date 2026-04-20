# Iteración: Actividades — paleta, KPI en_cola, calendario 07-20, validaciones form
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
1. KPI "En cola" suma `cantidad_pendiente` (multiplicadores cuentan como unitarios).
2. Paleta de estados:
   - en_cola = plomo `#64748b`
   - coordinado_con_cliente = rojo `#dc2626`
   - agendado_con_tecnico = celeste `#0ea5e9`
   - visita_fallida = café `#8b4513`
   - completada = verde `#5ccb5f`
3. Calendario: vista default 07:00-20:00 con scroll para ver fuera. Mejoras visuales a los bloques.
4. Form: `estado` y `tipo_actividad_id` obligatorios. Si hay `tecnico_id` y estado NO ∈ {agendado_con_tecnico, visita_fallida, completada} → error inline.

## Criterios de aceptación
- [ ] Card "En cola" muestra total sumando multiplicadores.
- [ ] 5 cards usan los nuevos colores; calendar bloques también.
- [ ] Calendario: arranca mostrando 07-20, permite scrollear fuera, altura fija.
- [ ] Form: validaciones inline con mensajes claros.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/core/utils/estado.util.ts` (paleta nueva: plomo / rojo / celeste / café / #5ccb5f; `colorDeActividad` delega en `colorDeEstado`)
- `agenda-beta/src/app/features/activities/activities-list.component.ts` (KPI en_cola suma `cantidad_pendiente`)
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (KPI en_cola suma `cantidad_pendiente`; `scrollTime: 07:00`; `height: 680`; estilos `.fc-event` y `.evt-*` refinados)
- `agenda-beta/src/app/features/activities/activity-form.component.ts` (validaciones: estado + tipo obligatorios; regla técnico ↔ estado; labels con `*`)
