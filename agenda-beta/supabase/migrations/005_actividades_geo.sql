-- =============================================================
-- Agenda_BETA :: 005 — coordenadas de ubicación en actividades
-- Agregadas para permitir autocomplete con Nominatim/OSM.
-- =============================================================

alter table public.actividades
  add column if not exists ubicacion_lat double precision,
  add column if not exists ubicacion_lng double precision;
