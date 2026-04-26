-- =============================================================
-- Agenda_BETA :: Migración 011
-- Asignación de tipo_usuario_id por defecto al crear un usuario
--
-- Problema:
--   El trigger handle_new_user (001_init.sql) creaba el perfil sin
--   tipo_usuario_id. Los usuarios invitados quedaban sin tipo hasta
--   intervención manual, y el front mostraba todo deshabilitado por
--   no tener permisos.
--
-- Solución:
--   - Extender handle_new_user para leer raw_user_meta_data->>'tipo_usuario_id'
--     (el front ya lo manda en options.data al invitar; ver users.service.ts).
--   - Si no viene metadata, asignar 'coordinador' como fallback seguro
--     (sin permisos críticos sobre usuarios o tipos_usuario).
--   - Backfill: usuarios existentes sin tipo_usuario_id quedan como
--     'coordinador'.
--
-- Idempotente: la función se redefine, el backfill usa WHERE NULL.
-- =============================================================

-- -----------------------------------------------------------------
-- 1. Función handle_new_user con asignación de tipo
-- -----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_tipo_id_meta uuid;
  v_tipo_id_default uuid;
begin
  -- Si el front mandó un tipo_usuario_id explícito en options.data, usarlo.
  begin
    v_tipo_id_meta := nullif(new.raw_user_meta_data->>'tipo_usuario_id', '')::uuid;
  exception when invalid_text_representation then
    v_tipo_id_meta := null;
  end;

  -- Fallback: 'coordinador' (tipo con permisos limitados, definido en 007)
  select id into v_tipo_id_default
  from public.tipos_usuario
  where nombre = 'coordinador'
  limit 1;

  insert into public.usuarios (id, nombre, apellido, email, tipo_usuario_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'apellido', ''),
    new.email,
    coalesce(v_tipo_id_meta, v_tipo_id_default)
  )
  on conflict (id) do nothing;

  return new;
end; $$;

-- Re-anclar el trigger por si la firma cambió
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------
-- 2. Backfill: usuarios sin tipo asignado quedan como 'coordinador'
-- -----------------------------------------------------------------
update public.usuarios u
set tipo_usuario_id = (
  select id from public.tipos_usuario where nombre = 'coordinador' limit 1
)
where u.tipo_usuario_id is null;
