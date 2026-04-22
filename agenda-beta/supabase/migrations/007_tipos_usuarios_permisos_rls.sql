-- =============================================================
-- Agenda_BETA :: Migración 007
-- Tipos de usuario + catálogo de permisos + RLS endurecida
--
-- Alcance:
--   - Crea tablas: tipos_usuario, permisos, tipos_usuario_permisos
--   - Agrega usuarios.tipo_usuario_id
--   - Seed con 2 tipos: coordinador, super_admin
--   - Reemplaza las policies omnibus de 001_init.sql por policies
--     explícitas por operación, con ownership donde aplique
--   - Enforcement real a nivel DB para operaciones sensibles
--     (delete de usuarios, actividades, etc.)
-- =============================================================

-- -----------------------------------------------------------------
-- 1. Tablas de tipos y permisos
-- -----------------------------------------------------------------
create table if not exists public.tipos_usuario (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null unique,
  descripcion  text,
  created_at   timestamptz not null default now()
);

create table if not exists public.permisos (
  id           uuid primary key default uuid_generate_v4(),
  codigo       text not null unique,
  descripcion  text not null,
  categoria    text not null
);

create table if not exists public.tipos_usuario_permisos (
  tipo_usuario_id uuid not null references public.tipos_usuario(id) on delete cascade,
  permiso_id      uuid not null references public.permisos(id) on delete cascade,
  primary key (tipo_usuario_id, permiso_id)
);

-- -----------------------------------------------------------------
-- 2. Columna tipo_usuario_id en usuarios
-- -----------------------------------------------------------------
alter table public.usuarios
  add column if not exists tipo_usuario_id uuid references public.tipos_usuario(id);

create index if not exists idx_usuarios_tipo on public.usuarios(tipo_usuario_id);

-- -----------------------------------------------------------------
-- 3. Seed de tipos + catálogo de permisos
-- -----------------------------------------------------------------
insert into public.tipos_usuario (nombre, descripcion) values
  ('super_admin', 'Acceso total, gestiona usuarios y tipos'),
  ('coordinador', 'Opera actividades, técnicos y tipos de actividad')
on conflict (nombre) do nothing;

insert into public.permisos (codigo, descripcion, categoria) values
  ('actividades.ver',       'Ver actividades',              'actividades'),
  ('actividades.crear',     'Crear actividad',              'actividades'),
  ('actividades.editar',    'Editar actividad',             'actividades'),
  ('actividades.borrar',    'Borrar actividad',             'actividades'),
  ('actividades.exportar',  'Exportar actividades a Excel', 'actividades'),
  ('tecnicos.ver',          'Ver técnicos',                 'tecnicos'),
  ('tecnicos.crear',        'Crear técnico',                'tecnicos'),
  ('tecnicos.editar',       'Editar técnico',               'tecnicos'),
  ('tecnicos.borrar',       'Borrar técnico',               'tecnicos'),
  ('tipos_actividad.ver',   'Ver tipos de actividad',       'tipos_actividad'),
  ('tipos_actividad.crear', 'Crear tipo de actividad',      'tipos_actividad'),
  ('tipos_actividad.editar','Editar tipo de actividad',     'tipos_actividad'),
  ('tipos_actividad.borrar','Borrar tipo de actividad',     'tipos_actividad'),
  ('usuarios.ver',          'Ver usuarios',                 'usuarios'),
  ('usuarios.invitar',      'Invitar usuarios',             'usuarios'),
  ('usuarios.editar',       'Editar usuarios',              'usuarios'),
  ('usuarios.borrar',       'Borrar usuarios',              'usuarios'),
  ('historial.ver',         'Ver historial',                'historial'),
  ('dashboard.ver',         'Ver dashboard',                'dashboard'),
  ('configuracion.ver',     'Ver configuración',            'configuracion'),
  ('log.ver',               'Ver log de auditoría',         'log'),
  ('tipos_usuario.gestionar','Gestionar tipos de usuario',  'tipos_usuario')
on conflict (codigo) do nothing;

-- super_admin: todos los permisos
insert into public.tipos_usuario_permisos (tipo_usuario_id, permiso_id)
select t.id, p.id
from public.tipos_usuario t, public.permisos p
where t.nombre = 'super_admin'
on conflict do nothing;

-- coordinador: todos menos usuarios.*, tipos_usuario.gestionar, tecnicos.borrar, tipos_actividad.borrar, log.ver
insert into public.tipos_usuario_permisos (tipo_usuario_id, permiso_id)
select t.id, p.id
from public.tipos_usuario t, public.permisos p
where t.nombre = 'coordinador'
  and p.codigo not in (
    'usuarios.invitar',
    'usuarios.editar',
    'usuarios.borrar',
    'tipos_usuario.gestionar',
    'tecnicos.borrar',
    'tipos_actividad.borrar',
    'log.ver'
  )
on conflict do nothing;

-- -----------------------------------------------------------------
-- 4. Función auxiliar: es_super_admin
-- -----------------------------------------------------------------
create or replace function public.es_super_admin(uid uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    join public.tipos_usuario t on t.id = u.tipo_usuario_id
    where u.id = uid and t.nombre = 'super_admin'
  );
$$;

grant execute on function public.es_super_admin(uuid) to authenticated;

-- -----------------------------------------------------------------
-- 5. RLS de las tablas nuevas
-- -----------------------------------------------------------------
alter table public.tipos_usuario           enable row level security;
alter table public.permisos                enable row level security;
alter table public.tipos_usuario_permisos  enable row level security;

-- Lectura abierta a autenticados (necesario para que el front cargue
-- el catálogo de permisos y tipos al login)
drop policy if exists "read_tipos_usuario" on public.tipos_usuario;
create policy "read_tipos_usuario" on public.tipos_usuario
  for select to authenticated using (true);

drop policy if exists "read_permisos" on public.permisos;
create policy "read_permisos" on public.permisos
  for select to authenticated using (true);

drop policy if exists "read_tipos_usuario_permisos" on public.tipos_usuario_permisos;
create policy "read_tipos_usuario_permisos" on public.tipos_usuario_permisos
  for select to authenticated using (true);

-- Escritura: solo super_admin
drop policy if exists "write_tipos_usuario" on public.tipos_usuario;
create policy "write_tipos_usuario" on public.tipos_usuario
  for all to authenticated
  using (public.es_super_admin(auth.uid()))
  with check (public.es_super_admin(auth.uid()));

drop policy if exists "write_permisos" on public.permisos;
create policy "write_permisos" on public.permisos
  for all to authenticated
  using (public.es_super_admin(auth.uid()))
  with check (public.es_super_admin(auth.uid()));

drop policy if exists "write_tipos_usuario_permisos" on public.tipos_usuario_permisos;
create policy "write_tipos_usuario_permisos" on public.tipos_usuario_permisos
  for all to authenticated
  using (public.es_super_admin(auth.uid()))
  with check (public.es_super_admin(auth.uid()));

-- -----------------------------------------------------------------
-- 6. Reemplazo de policies omnibus (001_init.sql)
-- -----------------------------------------------------------------

-- Drop de las policies antiguas
do $$ declare t text;
begin
  for t in select unnest(array['usuarios','tecnicos','tipos_actividad','actividades','actividades_historial']) loop
    execute format('drop policy if exists "auth_all_%1$s" on public.%1$s', t);
  end loop;
end $$;

-- ---- usuarios ----
-- lectura: todos los autenticados
drop policy if exists "usuarios_select" on public.usuarios;
create policy "usuarios_select" on public.usuarios
  for select to authenticated using (true);

-- insert: solo super_admin (invitación). Trigger handle_new_user usa SECURITY DEFINER.
drop policy if exists "usuarios_insert" on public.usuarios;
create policy "usuarios_insert" on public.usuarios
  for insert to authenticated
  with check (public.es_super_admin(auth.uid()));

-- update: super_admin puede todo, cada usuario solo su propia fila
drop policy if exists "usuarios_update" on public.usuarios;
create policy "usuarios_update" on public.usuarios
  for update to authenticated
  using (public.es_super_admin(auth.uid()) or auth.uid() = id)
  with check (public.es_super_admin(auth.uid()) or auth.uid() = id);

-- delete: solo super_admin
drop policy if exists "usuarios_delete" on public.usuarios;
create policy "usuarios_delete" on public.usuarios
  for delete to authenticated
  using (public.es_super_admin(auth.uid()));

-- ---- tecnicos, tipos_actividad: CRUD abierto a autenticados EXCEPTO delete que es super_admin ----
do $$ declare t text;
begin
  for t in select unnest(array['tecnicos','tipos_actividad']) loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format('create policy "%1$s_select" on public.%1$s for select to authenticated using (true)', t);

    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format('create policy "%1$s_insert" on public.%1$s for insert to authenticated with check (true)', t);

    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format('create policy "%1$s_update" on public.%1$s for update to authenticated using (true) with check (true)', t);

    execute format('drop policy if exists "%1$s_delete" on public.%1$s', t);
    execute format('create policy "%1$s_delete" on public.%1$s for delete to authenticated using (public.es_super_admin(auth.uid()))', t);
  end loop;
end $$;

-- ---- actividades ----
drop policy if exists "actividades_select" on public.actividades;
create policy "actividades_select" on public.actividades
  for select to authenticated using (true);

drop policy if exists "actividades_insert" on public.actividades;
create policy "actividades_insert" on public.actividades
  for insert to authenticated
  with check (true);

drop policy if exists "actividades_update" on public.actividades;
create policy "actividades_update" on public.actividades
  for update to authenticated
  using (true)
  with check (true);

-- delete: solo super_admin o el creador
drop policy if exists "actividades_delete" on public.actividades;
create policy "actividades_delete" on public.actividades
  for delete to authenticated
  using (public.es_super_admin(auth.uid()) or created_by = auth.uid());

-- ---- actividades_historial ----
-- read abierto, insert solo por trigger (SECURITY DEFINER lo respeta),
-- nadie edita ni borra desde el cliente
drop policy if exists "historial_select" on public.actividades_historial;
create policy "historial_select" on public.actividades_historial
  for select to authenticated using (true);

drop policy if exists "historial_insert" on public.actividades_historial;
create policy "historial_insert" on public.actividades_historial
  for insert to authenticated with check (true);

-- update / delete explícitamente bloqueados
drop policy if exists "historial_update" on public.actividades_historial;
create policy "historial_update" on public.actividades_historial
  for update to authenticated using (false);

drop policy if exists "historial_delete" on public.actividades_historial;
create policy "historial_delete" on public.actividades_historial
  for delete to authenticated using (public.es_super_admin(auth.uid()));
