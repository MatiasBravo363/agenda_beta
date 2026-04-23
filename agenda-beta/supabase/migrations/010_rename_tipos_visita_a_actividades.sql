-- =============================================================
-- Agenda_BETA :: Migración 010
-- Rename del concepto "tipo de visita" (categoría) a "actividad".
--
-- Modelo resultante:
--   - visita (registro en terreno)
--   - actividad (categoría/tipo que se ejecuta durante una visita)
--
-- Alcance:
--   - Tablas: tipos_visita -> actividades,
--     visita_tipos_visita -> visita_actividades.
--   - Columnas: tipo_visita_id -> actividad_id (en visitas y pivote).
--   - Constraints, índices, policies renombrados.
--   - Permisos: tipos_visita.* -> actividades.* (codigo + categoria).
--
-- Idempotente: todos los renames tienen guard de existencia previa.
-- =============================================================

-- -----------------------------------------------------------------
-- 1. RENAME de tablas
-- -----------------------------------------------------------------
alter table if exists public.tipos_visita         rename to actividades;
alter table if exists public.visita_tipos_visita  rename to visita_actividades;

-- -----------------------------------------------------------------
-- 2. RENAME de columnas
-- -----------------------------------------------------------------
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='visitas' and column_name='tipo_visita_id') then
    alter table public.visitas rename column tipo_visita_id to actividad_id;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='visita_actividades' and column_name='tipo_visita_id') then
    alter table public.visita_actividades rename column tipo_visita_id to actividad_id;
  end if;
end $$;

-- -----------------------------------------------------------------
-- 3. RENAME de constraints
-- -----------------------------------------------------------------
do $$ declare _renames text[][] := array[
  ['visitas_tipo_visita_id_fkey',                    'visitas_actividad_id_fkey',                    'visitas'],

  ['tipos_visita_pkey',                              'actividades_pkey',                             'actividades'],
  ['tipos_visita_nombre_key',                        'actividades_nombre_key',                       'actividades'],

  ['visita_tipos_visita_pkey',                       'visita_actividades_pkey',                      'visita_actividades'],
  ['visita_tipos_visita_visita_id_fkey',             'visita_actividades_visita_id_fkey',            'visita_actividades'],
  ['visita_tipos_visita_tipo_visita_id_fkey',        'visita_actividades_actividad_id_fkey',         'visita_actividades']
];
declare r text[];
begin
  foreach r slice 1 in array _renames loop
    if r[1] <> r[2]
       and exists (select 1 from pg_constraint c
                   join pg_namespace n on n.oid = c.connamespace
                   where n.nspname='public' and c.conname = r[1])
       and not exists (select 1 from pg_constraint c
                       join pg_namespace n on n.oid = c.connamespace
                       where n.nspname='public' and c.conname = r[2]) then
      execute format('alter table public.%I rename constraint %I to %I', r[3], r[1], r[2]);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------
-- 4. RENAME de índices
-- -----------------------------------------------------------------
alter index if exists public.idx_visita_tipos_tipo rename to idx_visita_actividades_actividad;

-- -----------------------------------------------------------------
-- 5. RENAME de policies RLS
-- -----------------------------------------------------------------
do $$ declare _renames text[][] := array[
  ['actividades',        'tipos_visita_select',          'actividades_select'],
  ['actividades',        'tipos_visita_insert',          'actividades_insert'],
  ['actividades',        'tipos_visita_update',          'actividades_update'],
  ['actividades',        'tipos_visita_delete',          'actividades_delete'],

  ['visita_actividades', 'visita_tipos_visita_select',   'visita_actividades_select'],
  ['visita_actividades', 'visita_tipos_visita_insert',   'visita_actividades_insert'],
  ['visita_actividades', 'visita_tipos_visita_update',   'visita_actividades_update'],
  ['visita_actividades', 'visita_tipos_visita_delete',   'visita_actividades_delete']
];
declare r text[];
begin
  foreach r slice 1 in array _renames loop
    if r[2] <> r[3]
       and exists (select 1 from pg_policies
                   where schemaname='public' and tablename = r[1] and policyname = r[2])
       and not exists (select 1 from pg_policies
                       where schemaname='public' and tablename = r[1] and policyname = r[3]) then
      execute format('alter policy %I on public.%I rename to %I', r[2], r[1], r[3]);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------
-- 6. Permisos: rename de codigos y categorías
-- -----------------------------------------------------------------
update public.permisos
set codigo = replace(codigo, 'tipos_visita.', 'actividades.')
where codigo like 'tipos_visita.%';

update public.permisos set categoria = 'actividades' where categoria = 'tipos_visita';
