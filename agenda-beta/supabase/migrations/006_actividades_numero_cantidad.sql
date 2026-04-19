-- =============================================================
-- Agenda_BETA :: 006 — numero correlativo + cantidad_pendiente
-- * `numero`: correlativo humano asignado por Postgres (BIGSERIAL).
-- * `cantidad_pendiente`: multiplicador de instancias por generar
--   desde una tarjeta "en cola" (persistencia del contador visual).
-- =============================================================

alter table public.actividades
  add column if not exists numero bigserial,
  add column if not exists cantidad_pendiente integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'actividades_numero_key'
  ) then
    alter table public.actividades add constraint actividades_numero_key unique (numero);
  end if;
end $$;

create index if not exists idx_actividades_numero on public.actividades(numero);
