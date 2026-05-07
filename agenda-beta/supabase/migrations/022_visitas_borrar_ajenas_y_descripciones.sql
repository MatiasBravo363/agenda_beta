-- =============================================================
-- Agenda_BETA :: Migración 022
-- Permiso "borrar visitas ajenas" + auditoría de descripciones
--
-- Cambios:
--   1. Helper SQL `tiene_permiso(codigo)` reutilizable para RLS.
--   2. Nuevo permiso `visitas.borrar_ajenas` + asignación a super_admin.
--   3. RLS de DELETE en visitas: ahora también permite borrar si el
--      usuario tiene `visitas.borrar_ajenas` (además de creador o
--      super_admin como antes).
--   4. Actualización de descripciones desactualizadas (mig 009 y 010
--      renombraron códigos pero no las descripciones, quedaron mencionando
--      "actividad" cuando ahora son "visita" y viceversa).
--   5. Limpieza de permisos obsoletos sin uso real:
--      - `historial.ver` (vista /historial removida en 1.0.20).
--      - `log.ver` (módulo nunca implementado).
--
-- Idempotente: usa ON CONFLICT / IF EXISTS donde corresponde.
-- =============================================================

-- -----------------------------------------------------------------
-- 1. Helper: ¿el usuario actual tiene permiso X?
-- -----------------------------------------------------------------
create or replace function public.tiene_permiso(p_codigo text)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    join public.tipos_usuario_permisos tup on tup.tipo_usuario_id = u.tipo_usuario_id
    join public.permisos p on p.id = tup.permiso_id
    where u.id = auth.uid() and p.codigo = p_codigo
  );
$$;

grant execute on function public.tiene_permiso(text) to authenticated;

-- -----------------------------------------------------------------
-- 2. Nuevo permiso visitas.borrar_ajenas + asignación a super_admin
-- -----------------------------------------------------------------
insert into public.permisos (codigo, descripcion, categoria) values
  ('visitas.borrar_ajenas', 'Borrar visitas creadas por otro usuario', 'visitas')
on conflict (codigo) do nothing;

insert into public.tipos_usuario_permisos (tipo_usuario_id, permiso_id)
select t.id, p.id
from public.tipos_usuario t, public.permisos p
where t.nombre = 'super_admin' and p.codigo = 'visitas.borrar_ajenas'
on conflict do nothing;

-- -----------------------------------------------------------------
-- 3. RLS DELETE de visitas: ampliar para incluir el permiso nuevo
-- -----------------------------------------------------------------
drop policy if exists "visitas_delete" on public.visitas;
create policy "visitas_delete" on public.visitas
  for delete to authenticated
  using (
    public.es_super_admin(auth.uid())
    or created_by = auth.uid()
    or public.tiene_permiso('visitas.borrar_ajenas')
  );

-- -----------------------------------------------------------------
-- 4. Actualización de descripciones desactualizadas
-- -----------------------------------------------------------------
update public.permisos set descripcion = 'Ver visitas'                 where codigo = 'visitas.ver';
update public.permisos set descripcion = 'Crear visita'                where codigo = 'visitas.crear';
update public.permisos set descripcion = 'Editar visita'               where codigo = 'visitas.editar';
update public.permisos set descripcion = 'Borrar visita'               where codigo = 'visitas.borrar';
update public.permisos set descripcion = 'Exportar visitas a Excel'    where codigo = 'visitas.exportar';
update public.permisos set descripcion = 'Ver actividades (catálogo)'  where codigo = 'actividades.ver';
update public.permisos set descripcion = 'Crear actividad (catálogo)' where codigo = 'actividades.crear';
update public.permisos set descripcion = 'Editar actividad (catálogo)' where codigo = 'actividades.editar';
update public.permisos set descripcion = 'Borrar actividad (catálogo)' where codigo = 'actividades.borrar';

-- -----------------------------------------------------------------
-- 5. Limpieza de permisos obsoletos
--    CASCADE elimina entries en tipos_usuario_permisos automáticamente
--    (por la FK con on delete cascade definida en la mig 007).
-- -----------------------------------------------------------------
delete from public.permisos where codigo in ('historial.ver', 'log.ver');

-- -----------------------------------------------------------------
-- 6. Schema version
-- -----------------------------------------------------------------
insert into public.schema_version (version, name)
values (22, 'visitas_borrar_ajenas_y_descripciones')
on conflict (version) do nothing;
