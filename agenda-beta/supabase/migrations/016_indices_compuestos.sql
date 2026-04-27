-- =============================================================
-- Agenda_BETA :: Migración 016
-- Índices compuestos en visitas para queries de dashboard y filtros.
--
-- Problema:
--   - Dashboard filtra por (fecha, estado, tecnico) simultáneamente.
--     Sin índice compuesto, scan secuencial en tablas grandes.
--   - Listado por creador (audit) sin índice → slow.
--   - Búsqueda de visitas clonadas (parent_visita_id) sin índice.
--
-- Solución:
--   Índices compuestos y parciales según el patrón de uso real
--   observado en VisitasService.listPaged() y dashboard queries.
--
-- Idempotente (uses CREATE INDEX IF NOT EXISTS).
-- =============================================================

-- Dashboard: filtra simultáneamente por fecha, estado y técnico.
-- Cubre el query más caliente del dashboard.
create index if not exists idx_visitas_dashboard
  on public.visitas (fecha_inicio, estado, tecnico_id);

-- Audit y listados de "visitas creadas por mí"
create index if not exists idx_visitas_creator
  on public.visitas (created_by);

-- Búsqueda de visitas clonadas (chain de fallidas → reintento).
-- Índice parcial: solo filas con parent_visita_id no nulo (la mayoría
-- de visitas no son clones, no vale la pena indexar todo).
create index if not exists idx_visitas_parent
  on public.visitas (parent_visita_id)
  where parent_visita_id is not null;

-- Auditoría: "qué cambió este usuario"
create index if not exists idx_visitas_historial_usuario
  on public.visitas_historial (usuario_id);

-- Auditoría: "qué pasó en esta visita en orden cronológico"
-- (visita_id ya tiene índice por FK, pero un compuesto con created_at acelera ORDER BY)
create index if not exists idx_visitas_historial_visita_created
  on public.visitas_historial (visita_id, created_at desc);
