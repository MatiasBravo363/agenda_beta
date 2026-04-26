-- =============================================================
-- Agenda_BETA :: Migración 013
-- Validación de transiciones de estado de visitas en DB
--
-- Problema:
--   El front valida algunas reglas (técnico requerido en ciertos
--   estados, fechas obligatorias) pero permite cualquier transición.
--   Un cliente API directo puede saltarse el flujo (p. ej. en_cola →
--   completada sin pasar por asignación), o "reabrir" visitas terminales.
--
-- Solución:
--   Trigger BEFORE UPDATE OF estado en `visitas` que bloquea las dos
--   transiciones catastróficas:
--     1. en_cola → completada (se debe pasar por agendado al menos)
--     2. completada → otros estados (terminal — sólo super_admin puede)
--
--   El resto de transiciones se permite para no romper flujos
--   existentes (p. ej. revertir un fallida a en_cola para reagendar).
--
-- Idempotente: drop trigger if exists + create or replace function.
-- =============================================================

create or replace function public.validar_transicion_visita()
returns trigger language plpgsql
set search_path = public
as $$
declare
  v_es_admin boolean;
begin
  -- Si no cambia el estado, nada que validar
  if new.estado is not distinct from old.estado then
    return new;
  end if;

  -- super_admin puede hacer cualquier transición (corrección de errores)
  v_es_admin := public.es_super_admin(auth.uid());
  if v_es_admin then
    return new;
  end if;

  -- 1. No saltar de en_cola a completada (debe pasar por asignación)
  if old.estado = 'en_cola' and new.estado = 'completada' then
    raise exception 'Transición no permitida: % -> %. Debe asignarse un técnico antes de marcar como completada.',
      old.estado, new.estado
      using errcode = '22023';
  end if;

  -- 2. completada es estado terminal: solo super_admin puede salir
  if old.estado = 'completada' then
    raise exception 'Transición no permitida: la visita está completada y solo un super admin puede modificarla.'
      using errcode = '22023';
  end if;

  return new;
end; $$;

drop trigger if exists trg_visita_validar_transicion on public.visitas;
create trigger trg_visita_validar_transicion
  before update of estado on public.visitas
  for each row execute function public.validar_transicion_visita();
