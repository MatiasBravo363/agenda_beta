-- =============================================================
-- Agenda_BETA :: Migración 015
-- Optimistic locking en visitas para evitar last-write-wins.
--
-- Problema:
--   Sin protección, dos coordinadores editando la misma visita en
--   simultáneo terminan con el último update sobreescribiendo
--   silenciosamente al primero. Pérdida de datos sin aviso.
--
-- Solución:
--   Trigger BEFORE UPDATE que compara el `updated_at` que envía el
--   cliente con el valor real en DB. Si el cliente trabajó sobre una
--   versión vieja, lanza error 40001 (serialization_failure) con
--   mensaje legible. La UI captura el error y ofrece recargar.
--
-- Backwards-compat:
--   Si el cliente NO envía `updated_at` en el payload, PostgreSQL
--   propaga old.updated_at a new.updated_at (no hay cambio); el
--   trigger interpreta esto como "cliente sin lock optimista" y
--   permite el UPDATE. Esto evita romper código existente que aún
--   no fue actualizado para enviar el timestamp.
--
-- Bypass:
--   super_admin puede forzar override (caso de soporte donde la
--   visita quedó "trabada" por un cliente que ya cerró sesión).
--
-- Orden de triggers:
--   PostgreSQL ejecuta triggers BEFORE UPDATE en orden alfabético.
--   `trg_visita_check_updated_at` (este) corre antes de
--   `trg_visitas_updated` (set_updated_at, existe desde 001/009).
--   El check usa el valor pre-set; después set_updated_at lo pisa
--   con now().
--
-- Idempotente.
-- =============================================================

create or replace function public.check_optimistic_lock_visita()
returns trigger language plpgsql
set search_path = public
as $$
begin
  -- Si super_admin, bypass del check
  if public.es_super_admin(auth.uid()) then
    return new;
  end if;

  -- Si el cliente envió un updated_at distinto al actual en DB
  -- (es decir, trabajó sobre una versión vieja), rechazar.
  -- new.updated_at se compara con old.updated_at: si el cliente NO
  -- envió updated_at, PostgreSQL propaga old → no hay diferencia →
  -- pasa (backwards-compat).
  if new.updated_at is distinct from old.updated_at then
    raise exception 'Conflicto: la visita fue modificada por otro usuario, recargá y volvé a intentar.'
      using errcode = '40001';
  end if;

  return new;
end; $$;

drop trigger if exists trg_visita_check_updated_at on public.visitas;
create trigger trg_visita_check_updated_at
  before update on public.visitas
  for each row execute function public.check_optimistic_lock_visita();

-- Documentar el contrato en la columna
comment on column public.visitas.updated_at is
  'Usado por optimistic locking. El cliente debe enviar el valor leído al cargar la visita; check_optimistic_lock_visita() rechaza el UPDATE con código 40001 si el valor difiere de DB. super_admin bypassea.';
