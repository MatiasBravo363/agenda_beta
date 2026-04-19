# Iteración: Historial — Trigger DB para registrar cambios de estado
Fecha: 2026-04-19
Estado: esperando revisión

## Diagnóstico
El historial estaba vacío porque sólo `ActivitiesService.changeStatus()` insertaba en `actividades_historial`, pero el form de actividad ([activity-form.component.ts](agenda-beta/src/app/features/activities/activity-form.component.ts)) usa `update()` directo que no pasa por ese método. No existía trigger DB.

## Requerimiento
Crear trigger en `public.actividades` que inserte automáticamente un registro en `public.actividades_historial` cada vez que cambia el campo `estado`.

## Criterios de aceptación
- [ ] Migración `003_historial_trigger.sql` aplicable con `IF EXISTS`/`IF NOT EXISTS`.
- [ ] Trigger captura `auth.uid()` y registra `estado_anterior` + `estado_nuevo`.
- [ ] Al cambiar estado en cualquier lugar del cliente, aparece una fila nueva en `/historial`.
- [ ] Eliminar el `.insert(actividades_historial)` duplicado de `ActivitiesService.changeStatus()` para evitar registros dobles.

## Follow-up (fuera de alcance)
- El trigger no guarda `comentario`. Si se necesitan comentarios, futura iteración: pasar comentario como contexto (p.ej. tabla puente o session variable).

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/supabase/migrations/003_historial_trigger.sql` (nuevo)
- `agenda-beta/src/app/core/services/activities.service.ts` (`changeStatus` simplificado — el trigger DB cubre el insert)
