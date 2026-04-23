-- =============================================================
-- Agenda_BETA :: Migración 009
-- Rename del dominio "actividad/actividades" a "visita/visitas".
--
-- Alcance:
--   - Tablas: actividades → visitas, actividades_historial → visitas_historial,
--     tipos_actividad → tipos_visita, actividad_tecnicos → visita_tecnicos,
--     actividad_tipos_actividad → visita_tipos_visita.
--   - Columnas: tipo_actividad_id → tipo_visita_id,
--     parent_activity_id → parent_visita_id, actividad_id → visita_id
--     (en las tablas pivote e historial).
--   - Constraints, índices, triggers, funciones y policies renombrados
--     para mantener nomenclatura consistente.
--   - Permisos: actividades.* → visitas.*, tipos_actividad.* → tipos_visita.*
--     (columna codigo) + categoria.
--
-- Idempotente: usa IF EXISTS y DO blocks con chequeo previo para poder
-- re-ejecutarse sin romper si ya fue aplicada parcialmente.
-- =============================================================

-- -----------------------------------------------------------------
-- 1. RENAME de tablas
-- -----------------------------------------------------------------
alter table if exists public.actividades                 rename to visitas;
alter table if exists public.actividades_historial       rename to visitas_historial;
alter table if exists public.tipos_actividad             rename to tipos_visita;
alter table if exists public.actividad_tecnicos          rename to visita_tecnicos;
alter table if exists public.actividad_tipos_actividad   rename to visita_tipos_visita;

-- -----------------------------------------------------------------
-- 2. RENAME de columnas
-- -----------------------------------------------------------------
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='visitas' and column_name='tipo_actividad_id') then
    alter table public.visitas rename column tipo_actividad_id to tipo_visita_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='visitas' and column_name='parent_activity_id') then
    alter table public.visitas rename column parent_activity_id to parent_visita_id;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='visitas_historial' and column_name='actividad_id') then
    alter table public.visitas_historial rename column actividad_id to visita_id;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='visita_tecnicos' and column_name='actividad_id') then
    alter table public.visita_tecnicos rename column actividad_id to visita_id;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='visita_tipos_visita' and column_name='actividad_id') then
    alter table public.visita_tipos_visita rename column actividad_id to visita_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='visita_tipos_visita' and column_name='tipo_actividad_id') then
    alter table public.visita_tipos_visita rename column tipo_actividad_id to tipo_visita_id;
  end if;
end $$;

-- -----------------------------------------------------------------
-- 3. RENAME de constraints (FKs, unique, check)
--    Los nombres originales vienen de Postgres auto-naming
--    sobre la tabla/columna antigua.
-- -----------------------------------------------------------------
do $$ declare _renames text[][] := array[
  -- visitas (ex actividades)
  ['actividades_tipo_actividad_id_fkey',      'visitas_tipo_visita_id_fkey',      'visitas'],
  ['actividades_tecnico_id_fkey',             'visitas_tecnico_id_fkey',          'visitas'],
  ['actividades_parent_activity_id_fkey',     'visitas_parent_visita_id_fkey',    'visitas'],
  ['actividades_created_by_fkey',             'visitas_created_by_fkey',          'visitas'],
  ['actividades_estado_check',                'visitas_estado_check',             'visitas'],
  ['actividades_numero_key',                  'visitas_numero_key',               'visitas'],
  ['actividades_pkey',                        'visitas_pkey',                     'visitas'],

  -- visitas_historial (ex actividades_historial)
  ['actividades_historial_pkey',              'visitas_historial_pkey',           'visitas_historial'],
  ['actividades_historial_actividad_id_fkey', 'visitas_historial_visita_id_fkey', 'visitas_historial'],
  ['actividades_historial_usuario_id_fkey',   'visitas_historial_usuario_id_fkey','visitas_historial'],

  -- tipos_visita (ex tipos_actividad)
  ['tipos_actividad_pkey',                    'tipos_visita_pkey',                'tipos_visita'],
  ['tipos_actividad_nombre_key',              'tipos_visita_nombre_key',          'tipos_visita'],

  -- visita_tecnicos (ex actividad_tecnicos)
  ['actividad_tecnicos_pkey',                 'visita_tecnicos_pkey',             'visita_tecnicos'],
  ['actividad_tecnicos_actividad_id_fkey',    'visita_tecnicos_visita_id_fkey',   'visita_tecnicos'],
  ['actividad_tecnicos_tecnico_id_fkey',      'visita_tecnicos_tecnico_id_fkey',  'visita_tecnicos'],

  -- visita_tipos_visita (ex actividad_tipos_actividad)
  ['actividad_tipos_actividad_pkey',              'visita_tipos_visita_pkey',             'visita_tipos_visita'],
  ['actividad_tipos_actividad_actividad_id_fkey', 'visita_tipos_visita_visita_id_fkey',   'visita_tipos_visita'],
  ['actividad_tipos_actividad_tipo_actividad_id_fkey', 'visita_tipos_visita_tipo_visita_id_fkey', 'visita_tipos_visita']
];
declare r text[];
begin
  foreach r slice 1 in array _renames loop
    if exists (select 1 from pg_constraint c
               join pg_namespace n on n.oid = c.connamespace
               where n.nspname='public' and c.conname = r[1]) then
      execute format('alter table public.%I rename constraint %I to %I', r[3], r[1], r[2]);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------
-- 4. RENAME de índices
-- -----------------------------------------------------------------
alter index if exists public.idx_actividades_fecha_inicio   rename to idx_visitas_fecha_inicio;
alter index if exists public.idx_actividades_tecnico        rename to idx_visitas_tecnico;
alter index if exists public.idx_actividades_estado         rename to idx_visitas_estado;
alter index if exists public.idx_actividades_numero         rename to idx_visitas_numero;
alter index if exists public.idx_historial_actividad        rename to idx_historial_visita;
alter index if exists public.idx_actividad_tecnicos_tecnico rename to idx_visita_tecnicos_tecnico;
alter index if exists public.idx_actividad_tipos_tipo       rename to idx_visita_tipos_tipo;

-- Secuencia del bigserial numero
alter sequence if exists public.actividades_numero_seq rename to visitas_numero_seq;

-- -----------------------------------------------------------------
-- 5. Función + triggers (historial y updated_at)
-- -----------------------------------------------------------------
-- Drop trigger viejo + función vieja (si todavía existen con nombre antiguo)
drop trigger if exists trg_actividad_estado_log on public.visitas;
drop trigger if exists trg_actividades_updated  on public.visitas;
drop function if exists public.log_actividad_estado_change();

-- Función nueva (con el cuerpo apuntando a visitas_historial + visita_id)
create or replace function public.log_visita_estado_change()
returns trigger language plpgsql security definer as $$
declare uid uuid;
begin
  if new.estado is distinct from old.estado then
    uid := auth.uid();
    insert into public.visitas_historial (visita_id, estado_anterior, estado_nuevo, usuario_id)
    values (new.id, old.estado, new.estado, uid);
  end if;
  return new;
end; $$;

-- Triggers nuevos sobre visitas
drop trigger if exists trg_visita_estado_log on public.visitas;
create trigger trg_visita_estado_log
  after update of estado on public.visitas
  for each row execute function public.log_visita_estado_change();

drop trigger if exists trg_visitas_updated on public.visitas;
create trigger trg_visitas_updated
  before update on public.visitas
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------
-- 6. RENAME de policies RLS
-- -----------------------------------------------------------------
do $$ declare _renames text[][] := array[
  ['visitas',             'actividades_select',       'visitas_select'],
  ['visitas',             'actividades_insert',       'visitas_insert'],
  ['visitas',             'actividades_update',       'visitas_update'],
  ['visitas',             'actividades_delete',       'visitas_delete'],

  -- historial_* ya tenía el nombre final desde migración 007 (sin prefijo actividades_).
  -- Dejamos las entradas por completitud pero el guard src != dst las salta.

  ['tipos_visita',        'tipos_actividad_select',   'tipos_visita_select'],
  ['tipos_visita',        'tipos_actividad_insert',   'tipos_visita_insert'],
  ['tipos_visita',        'tipos_actividad_update',   'tipos_visita_update'],
  ['tipos_visita',        'tipos_actividad_delete',   'tipos_visita_delete'],

  ['visita_tecnicos',     'actividad_tecnicos_select','visita_tecnicos_select'],
  ['visita_tecnicos',     'actividad_tecnicos_insert','visita_tecnicos_insert'],
  ['visita_tecnicos',     'actividad_tecnicos_update','visita_tecnicos_update'],
  ['visita_tecnicos',     'actividad_tecnicos_delete','visita_tecnicos_delete'],

  ['visita_tipos_visita', 'actividad_tipos_actividad_select','visita_tipos_visita_select'],
  ['visita_tipos_visita', 'actividad_tipos_actividad_insert','visita_tipos_visita_insert'],
  ['visita_tipos_visita', 'actividad_tipos_actividad_update','visita_tipos_visita_update'],
  ['visita_tipos_visita', 'actividad_tipos_actividad_delete','visita_tipos_visita_delete']
];
declare r text[];
begin
  foreach r slice 1 in array _renames loop
    -- Skip identity renames (src == dst) y renames donde el destino ya existe.
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
-- 7. Permisos: rename de codigos y categorías
-- -----------------------------------------------------------------
update public.permisos
set codigo = replace(codigo, 'actividades.', 'visitas.')
where codigo like 'actividades.%';

update public.permisos
set codigo = replace(codigo, 'tipos_actividad.', 'tipos_visita.')
where codigo like 'tipos_actividad.%';

update public.permisos set categoria = 'visitas'       where categoria = 'actividades';
update public.permisos set categoria = 'tipos_visita'  where categoria = 'tipos_actividad';
