-- =============================================================
-- Agenda_BETA :: Migración 019
-- Backfill en schema_version de migraciones 015-019.
--
-- La tabla schema_version (creada en 014) sirve como source-of-truth
-- de qué migraciones fueron aplicadas en cada entorno. Cada migración
-- nueva debería agregar su entrada al final.
-- =============================================================

insert into public.schema_version (version, name) values
  (15, 'optimistic_locking_visitas'),
  (16, 'indices_compuestos'),
  (17, 'historial_extendido'),
  (18, 'feature_flags'),
  (19, 'schema_version_backfill')
on conflict (version) do nothing;
