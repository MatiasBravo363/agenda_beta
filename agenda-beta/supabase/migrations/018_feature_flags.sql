-- =============================================================
-- Agenda_BETA :: Migración 018
-- Tabla de feature flags para activar/desactivar funcionalidades
-- en runtime sin redeploy.
--
-- Uso típico:
--   - Esconder UI nueva (`ui_paginacion_visible`) hasta validar.
--   - Apagar features con bug crítico mientras se prepara hotfix.
--   - Probar features con un % de usuarios (rollout_percent).
--
-- Lectura: cualquier autenticado.
-- Escritura: solo super_admin.
-- =============================================================

create table if not exists public.feature_flags (
  key             text primary key,
  enabled         boolean not null default false,
  rollout_percent int not null default 0 check (rollout_percent between 0 and 100),
  description     text,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references public.usuarios(id) on delete set null
);

-- Trigger para mantener updated_at
drop trigger if exists trg_feature_flags_updated on public.feature_flags;
create trigger trg_feature_flags_updated
  before update on public.feature_flags
  for each row execute function public.set_updated_at();

-- RLS
alter table public.feature_flags enable row level security;

drop policy if exists "feature_flags_select" on public.feature_flags;
create policy "feature_flags_select" on public.feature_flags
  for select to authenticated using (true);

drop policy if exists "feature_flags_insert" on public.feature_flags;
create policy "feature_flags_insert" on public.feature_flags
  for insert to authenticated
  with check (public.es_super_admin(auth.uid()));

drop policy if exists "feature_flags_update" on public.feature_flags;
create policy "feature_flags_update" on public.feature_flags
  for update to authenticated
  using (public.es_super_admin(auth.uid()))
  with check (public.es_super_admin(auth.uid()));

drop policy if exists "feature_flags_delete" on public.feature_flags;
create policy "feature_flags_delete" on public.feature_flags
  for delete to authenticated
  using (public.es_super_admin(auth.uid()));

-- Seed inicial: dos flags de ejemplo en off
insert into public.feature_flags (key, enabled, description) values
  ('ui_paginacion_visible',
   true,
   'UI explícita de paginación en /visitas/lista (selector de tamaño + footer con páginas). Si false, listado descarga hasta 500 sin UI paginada.'),
  ('dashboard_v2',
   false,
   'Habilita features experimentales del dashboard. Reservado para iteraciones futuras.')
on conflict (key) do nothing;
