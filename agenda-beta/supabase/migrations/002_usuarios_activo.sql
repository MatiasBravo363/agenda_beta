-- =============================================================
-- Agenda_BETA :: 002 — campo activo en usuarios
-- Agrega flag boolean para habilitar/deshabilitar usuarios
-- desde el panel admin, sin borrar su auth user.
-- =============================================================

alter table public.usuarios
  add column if not exists activo boolean not null default true;
