-- =============================================================
-- Agenda_BETA :: Migración 008
-- Asignación múltiple de técnicos y tipos por actividad
--
-- Alcance:
--   - Crea tablas pivote actividad_tecnicos y actividad_tipos_actividad.
--   - Backfill desde las FKs simples actividades.tecnico_id y
--     actividades.tipo_actividad_id.
--   - Mantiene las FKs simples para compatibilidad transicional:
--     la app las setea con el "principal" (primer elemento del array).
--   - Policies RLS siguiendo el patrón de migración 007.
-- =============================================================

-- -----------------------------------------------------------------
-- 1. Tablas pivote
-- -----------------------------------------------------------------
create table if not exists public.actividad_tecnicos (
  actividad_id uuid not null references public.actividades(id) on delete cascade,
  tecnico_id   uuid not null references public.tecnicos(id)    on delete cascade,
  primary key (actividad_id, tecnico_id)
);

create index if not exists idx_actividad_tecnicos_tecnico on public.actividad_tecnicos(tecnico_id);

create table if not exists public.actividad_tipos_actividad (
  actividad_id      uuid not null references public.actividades(id)     on delete cascade,
  tipo_actividad_id uuid not null references public.tipos_actividad(id) on delete cascade,
  primary key (actividad_id, tipo_actividad_id)
);

create index if not exists idx_actividad_tipos_tipo on public.actividad_tipos_actividad(tipo_actividad_id);

-- -----------------------------------------------------------------
-- 2. Backfill desde FKs simples
-- -----------------------------------------------------------------
insert into public.actividad_tecnicos (actividad_id, tecnico_id)
select id, tecnico_id
from public.actividades
where tecnico_id is not null
on conflict do nothing;

insert into public.actividad_tipos_actividad (actividad_id, tipo_actividad_id)
select id, tipo_actividad_id
from public.actividades
where tipo_actividad_id is not null
on conflict do nothing;

-- -----------------------------------------------------------------
-- 3. RLS + policies (patrón migración 007)
-- -----------------------------------------------------------------
alter table public.actividad_tecnicos         enable row level security;
alter table public.actividad_tipos_actividad  enable row level security;

do $$ declare t text;
begin
  for t in select unnest(array['actividad_tecnicos','actividad_tipos_actividad']) loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format('create policy "%1$s_select" on public.%1$s for select to authenticated using (true)', t);

    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format('create policy "%1$s_insert" on public.%1$s for insert to authenticated with check (true)', t);

    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format('create policy "%1$s_update" on public.%1$s for update to authenticated using (true) with check (true)', t);

    execute format('drop policy if exists "%1$s_delete" on public.%1$s', t);
    execute format('create policy "%1$s_delete" on public.%1$s for delete to authenticated using (true)', t);
  end loop;
end $$;
