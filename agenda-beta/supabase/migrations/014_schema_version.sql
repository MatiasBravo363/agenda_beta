-- =============================================================
-- Agenda_BETA :: Migración 014
-- Tabla schema_version para trazabilidad de migraciones aplicadas
--
-- Problema:
--   Las migraciones se aplican manualmente desde el dashboard de
--   Supabase (no hay CLI link). No hay forma de saber qué migración
--   está en cada entorno → drift entre dev/staging/prod.
--
-- Solución:
--   Tabla `public.schema_version` que registra cada migración aplicada.
--   Convención: cada nueva migración debe terminar con
--     insert into public.schema_version (version, name)
--       values (NNN, 'descripcion_corta')
--       on conflict (version) do nothing;
--
--   Backfill manual de las migraciones 001..014.
--
-- Lectura abierta a autenticados, escritura solo super_admin (RLS).
-- =============================================================

create table if not exists public.schema_version (
  version     integer primary key,
  name        text not null,
  applied_at  timestamptz not null default now(),
  applied_by  text default current_user
);

alter table public.schema_version enable row level security;

drop policy if exists "schema_version_select" on public.schema_version;
create policy "schema_version_select" on public.schema_version
  for select to authenticated using (true);

drop policy if exists "schema_version_insert" on public.schema_version;
create policy "schema_version_insert" on public.schema_version
  for insert to authenticated
  with check (public.es_super_admin(auth.uid()));

drop policy if exists "schema_version_update" on public.schema_version;
create policy "schema_version_update" on public.schema_version
  for update to authenticated using (false);

drop policy if exists "schema_version_delete" on public.schema_version;
create policy "schema_version_delete" on public.schema_version
  for delete to authenticated using (false);

-- -----------------------------------------------------------------
-- Backfill de migraciones existentes
-- -----------------------------------------------------------------
insert into public.schema_version (version, name) values
  (1,  'init'),
  (2,  'usuarios_activo'),
  (3,  'historial_trigger'),
  (4,  'usuarios_last_sign_in'),
  (5,  'actividades_geo'),
  (6,  'actividades_numero_cantidad'),
  (7,  'tipos_usuarios_permisos_rls'),
  (8,  'actividades_multi_asignacion'),
  (9,  'rename_actividades_a_visitas'),
  (10, 'rename_tipos_visita_a_actividades'),
  (11, 'default_tipo_usuario_en_alta'),
  (12, 'rls_pivotes_restrictivo'),
  (13, 'validar_transiciones_estado_visita'),
  (14, 'schema_version')
on conflict (version) do nothing;
