-- =============================================================
-- Agenda_BETA :: 003 — trigger para registrar cambios de estado
-- Inserta en actividades_historial cada vez que estado cambia.
-- =============================================================

create or replace function public.log_actividad_estado_change()
returns trigger language plpgsql security definer as $$
declare uid uuid;
begin
  if new.estado is distinct from old.estado then
    uid := auth.uid();
    insert into public.actividades_historial
      (actividad_id, estado_anterior, estado_nuevo, usuario_id)
    values (new.id, old.estado, new.estado, uid);
  end if;
  return new;
end; $$;

drop trigger if exists trg_actividad_estado_log on public.actividades;
create trigger trg_actividad_estado_log
  after update of estado on public.actividades
  for each row execute function public.log_actividad_estado_change();
