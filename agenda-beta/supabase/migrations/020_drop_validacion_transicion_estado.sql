-- =============================================================
-- Agenda_BETA :: Migración 020
-- Drop trigger de validación de transiciones de estado (trigger 013).
--
-- Contexto:
--   La migración 013 introdujo `trg_visita_validar_transicion` que
--   bloqueaba dos transiciones para usuarios no super_admin:
--     1. en_cola → completada (saltarse el flujo)
--     2. completada → cualquier otro (reabrir visita terminal)
--
--   Con 1.0.18 se redefinió la regla de negocio: el permiso
--   `visitas.editar` es el único gate de edición completa, incluido
--   transiciones de estado. Coordinadores con `visitas.editar` necesitan
--   poder corregir el estado de visitas ya completadas (errores de
--   marcado, reapertura por reclamo de cliente, etc.) sin depender de
--   super_admin.
--
--   El permiso `visitas.editar` ya está gateado en el form Angular
--   (1.0.18), y RLS de la tabla `visitas` para UPDATE sigue abierto a
--   autenticados — el control de quién puede editar queda 100% en el
--   permiso, no en el estado.
--
-- Cambio:
--   Drop del trigger y de la función. La validación inversa (estado
--   X requiere técnico) sigue activa en el form (validación bidireccional
--   en `save()` desde 1.0.18).
--
-- Reversión: si se decidiera volver a la regla, re-ejecutar migración 013.
-- Idempotente: usa IF EXISTS.
-- =============================================================

drop trigger if exists trg_visita_validar_transicion on public.visitas;
drop function if exists public.validar_transicion_visita();

insert into public.schema_version (version, name) values
  (20, 'drop_validacion_transicion_estado')
on conflict (version) do nothing;
