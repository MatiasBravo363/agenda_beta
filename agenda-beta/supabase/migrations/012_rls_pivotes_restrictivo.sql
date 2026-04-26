-- =============================================================
-- Agenda_BETA :: Migración 012
-- RLS restrictivo sobre tablas pivote visita_tecnicos y visita_actividades.
--
-- Problema:
--   Las policies creadas en 008 (renombradas en 009/010) eran
--   `using (true) with check (true)` para INSERT/UPDATE/DELETE.
--   Cualquier usuario autenticado podía asignar/desasignar técnicos
--   o actividades a visitas ajenas. La RLS en `visitas` (creador o
--   super_admin para borrar) quedaba esquivada por estas tablas.
--
-- Solución:
--   Reemplazar las policies con check de ownership: solo el `created_by`
--   de la visita o un super_admin puede mutar el pivote.
--   SELECT queda abierto a autenticados (ya estaba) para que las
--   listas y joins sigan funcionando como hoy.
--
-- Idempotente: drop policy if exists + create policy.
-- =============================================================

-- -----------------------------------------------------------------
-- Helper: ¿la visita pertenece al usuario actual?
-- -----------------------------------------------------------------
create or replace function public.es_visita_propia(p_visita_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.visitas v
    where v.id = p_visita_id
      and v.created_by = auth.uid()
  );
$$;

grant execute on function public.es_visita_propia(uuid) to authenticated;

-- -----------------------------------------------------------------
-- visita_tecnicos
-- -----------------------------------------------------------------
drop policy if exists "visita_tecnicos_insert" on public.visita_tecnicos;
create policy "visita_tecnicos_insert" on public.visita_tecnicos
  for insert to authenticated
  with check (
    public.es_super_admin(auth.uid())
    or public.es_visita_propia(visita_id)
  );

drop policy if exists "visita_tecnicos_update" on public.visita_tecnicos;
create policy "visita_tecnicos_update" on public.visita_tecnicos
  for update to authenticated
  using (
    public.es_super_admin(auth.uid())
    or public.es_visita_propia(visita_id)
  )
  with check (
    public.es_super_admin(auth.uid())
    or public.es_visita_propia(visita_id)
  );

drop policy if exists "visita_tecnicos_delete" on public.visita_tecnicos;
create policy "visita_tecnicos_delete" on public.visita_tecnicos
  for delete to authenticated
  using (
    public.es_super_admin(auth.uid())
    or public.es_visita_propia(visita_id)
  );

-- -----------------------------------------------------------------
-- visita_actividades
-- -----------------------------------------------------------------
drop policy if exists "visita_actividades_insert" on public.visita_actividades;
create policy "visita_actividades_insert" on public.visita_actividades
  for insert to authenticated
  with check (
    public.es_super_admin(auth.uid())
    or public.es_visita_propia(visita_id)
  );

drop policy if exists "visita_actividades_update" on public.visita_actividades;
create policy "visita_actividades_update" on public.visita_actividades
  for update to authenticated
  using (
    public.es_super_admin(auth.uid())
    or public.es_visita_propia(visita_id)
  )
  with check (
    public.es_super_admin(auth.uid())
    or public.es_visita_propia(visita_id)
  );

drop policy if exists "visita_actividades_delete" on public.visita_actividades;
create policy "visita_actividades_delete" on public.visita_actividades
  for delete to authenticated
  using (
    public.es_super_admin(auth.uid())
    or public.es_visita_propia(visita_id)
  );
