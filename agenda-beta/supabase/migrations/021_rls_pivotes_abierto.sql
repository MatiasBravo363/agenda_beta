-- =============================================================
-- Agenda_BETA :: Migración 021
-- Abrir RLS de tablas pivote (visita_tecnicos y visita_actividades) a
-- cualquier authenticated. Reemplaza la migración 012.
--
-- Contexto:
--   Migración 012 había restringido INSERT/UPDATE/DELETE en los pivotes
--   a `super_admin OR es_visita_propia(visita_id)` — solo el creador de
--   la visita o un super_admin podían modificar técnicos/actividades.
--
--   Reporte del usuario (1.0.18): coordinadores con `visitas.editar`
--   editando visitas ajenas reciben:
--     'new row violates row-level security policy for table "visita_tecnicos"'
--
--   Decisión de negocio (alineada con drop del trigger 013 en mig. 020):
--   `visitas.editar` se vuelve el **único gate** de edición, sin
--   restricciones DB. El form Angular ya gatea con `<fieldset disabled>`
--   los inputs si el user no tiene el permiso.
--
--   La RLS de la tabla `visitas` para UPDATE ya estaba `using (true)` desde
--   migración 007. Esta migración alinea los pivotes al mismo modelo.
--
-- Riesgo:
--   Pierde la protección "solo el creador puede modificar pivotes". Mitigado
--   por: (a) el form gatea con visitas.editar; (b) historial via trigger 017
--   captura cambios; (c) todos los usuarios autenticados ya están bajo el
--   paraguas del control de permisos a nivel app.
--
-- Reversión: re-ejecutar migración 012.
-- Idempotente: drop policy if exists + create policy.
-- =============================================================

-- -----------------------------------------------------------------
-- visita_tecnicos
-- -----------------------------------------------------------------
drop policy if exists "visita_tecnicos_insert" on public.visita_tecnicos;
create policy "visita_tecnicos_insert" on public.visita_tecnicos
  for insert to authenticated
  with check (true);

drop policy if exists "visita_tecnicos_update" on public.visita_tecnicos;
create policy "visita_tecnicos_update" on public.visita_tecnicos
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists "visita_tecnicos_delete" on public.visita_tecnicos;
create policy "visita_tecnicos_delete" on public.visita_tecnicos
  for delete to authenticated
  using (true);

-- -----------------------------------------------------------------
-- visita_actividades
-- -----------------------------------------------------------------
drop policy if exists "visita_actividades_insert" on public.visita_actividades;
create policy "visita_actividades_insert" on public.visita_actividades
  for insert to authenticated
  with check (true);

drop policy if exists "visita_actividades_update" on public.visita_actividades;
create policy "visita_actividades_update" on public.visita_actividades
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists "visita_actividades_delete" on public.visita_actividades;
create policy "visita_actividades_delete" on public.visita_actividades
  for delete to authenticated
  using (true);

-- -----------------------------------------------------------------
-- Schema version
-- -----------------------------------------------------------------
insert into public.schema_version (version, name) values
  (21, 'rls_pivotes_abierto')
on conflict (version) do nothing;
