-- =============================================================
-- Agenda_BETA :: Migración 017
-- Audit log extendido en visitas_historial.
--
-- Problema:
--   Hoy solo se registran cambios de estado (migración 003/009).
--   Cambios de fechas, técnico asignado, actividad, descripción,
--   ubicación, etc. no quedan auditados → compliance débil y
--   debug post-incidente complicado.
--
-- Solución:
--   1. Agregar columnas `cambios jsonb` y `accion text` a
--      visitas_historial.
--   2. Reemplazar log_visita_estado_change() por log_visita_change()
--      que detecta cambios en N campos relevantes y serializa el
--      delta como jsonb {campo: {antes, despues}}.
--   3. Trigger AFTER UPDATE captura todos los UPDATEs (no solo
--      cambios de estado). AFTER INSERT registra la creación.
--   4. Mantiene `estado_anterior`/`estado_nuevo` poblados para no
--      romper la UI de historial existente.
--
-- Idempotente.
-- =============================================================

-- -----------------------------------------------------------------
-- 1. Columnas nuevas
-- -----------------------------------------------------------------
alter table public.visitas_historial
  add column if not exists cambios jsonb,
  add column if not exists accion text check (accion in ('insert', 'update', 'delete'));

create index if not exists idx_visitas_historial_accion
  on public.visitas_historial (accion);

-- -----------------------------------------------------------------
-- 2. Función nueva: serializa el delta de campos relevantes
-- -----------------------------------------------------------------
create or replace function public.log_visita_change()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_uid     uuid;
  v_cambios jsonb;
begin
  v_uid := auth.uid();
  v_cambios := '{}'::jsonb;

  if tg_op = 'INSERT' then
    -- Snapshot de creación: campos clave del estado inicial.
    v_cambios := jsonb_build_object(
      'estado',         to_jsonb(new.estado),
      'fecha_inicio',   to_jsonb(new.fecha_inicio),
      'fecha_fin',      to_jsonb(new.fecha_fin),
      'tecnico_id',     to_jsonb(new.tecnico_id),
      'actividad_id',   to_jsonb(new.actividad_id),
      'nombre_cliente', to_jsonb(new.nombre_cliente)
    );

    insert into public.visitas_historial
      (visita_id, estado_anterior, estado_nuevo, usuario_id, accion, cambios)
    values (new.id, null, new.estado, v_uid, 'insert', v_cambios);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Construir el delta solo con los campos que efectivamente cambiaron.
    if new.estado is distinct from old.estado then
      v_cambios := v_cambios || jsonb_build_object('estado',
        jsonb_build_object('antes', to_jsonb(old.estado), 'despues', to_jsonb(new.estado)));
    end if;
    if new.fecha_inicio is distinct from old.fecha_inicio then
      v_cambios := v_cambios || jsonb_build_object('fecha_inicio',
        jsonb_build_object('antes', to_jsonb(old.fecha_inicio), 'despues', to_jsonb(new.fecha_inicio)));
    end if;
    if new.fecha_fin is distinct from old.fecha_fin then
      v_cambios := v_cambios || jsonb_build_object('fecha_fin',
        jsonb_build_object('antes', to_jsonb(old.fecha_fin), 'despues', to_jsonb(new.fecha_fin)));
    end if;
    if new.tecnico_id is distinct from old.tecnico_id then
      v_cambios := v_cambios || jsonb_build_object('tecnico_id',
        jsonb_build_object('antes', to_jsonb(old.tecnico_id), 'despues', to_jsonb(new.tecnico_id)));
    end if;
    if new.actividad_id is distinct from old.actividad_id then
      v_cambios := v_cambios || jsonb_build_object('actividad_id',
        jsonb_build_object('antes', to_jsonb(old.actividad_id), 'despues', to_jsonb(new.actividad_id)));
    end if;
    if new.nombre_cliente is distinct from old.nombre_cliente then
      v_cambios := v_cambios || jsonb_build_object('nombre_cliente',
        jsonb_build_object('antes', to_jsonb(old.nombre_cliente), 'despues', to_jsonb(new.nombre_cliente)));
    end if;
    if new.descripcion is distinct from old.descripcion then
      v_cambios := v_cambios || jsonb_build_object('descripcion',
        jsonb_build_object('antes', to_jsonb(old.descripcion), 'despues', to_jsonb(new.descripcion)));
    end if;
    if new.ubicacion is distinct from old.ubicacion then
      v_cambios := v_cambios || jsonb_build_object('ubicacion',
        jsonb_build_object('antes', to_jsonb(old.ubicacion), 'despues', to_jsonb(new.ubicacion)));
    end if;

    -- Si nada relevante cambió, no registrar (evita ruido de updates de updated_at solo)
    if v_cambios = '{}'::jsonb then
      return new;
    end if;

    insert into public.visitas_historial
      (visita_id, estado_anterior, estado_nuevo, usuario_id, accion, cambios)
    values (
      new.id,
      case when new.estado is distinct from old.estado then old.estado else null end,
      coalesce(new.estado, old.estado),
      v_uid,
      'update',
      v_cambios
    );
    return new;
  end if;

  return new;
end; $$;

-- -----------------------------------------------------------------
-- 3. Triggers
-- -----------------------------------------------------------------
-- Drop el trigger viejo (solo escuchaba cambios de estado)
drop trigger if exists trg_visita_estado_log on public.visitas;

-- Triggers nuevos: capturan INSERT y UPDATE (cualquier campo)
drop trigger if exists trg_visita_log_insert on public.visitas;
create trigger trg_visita_log_insert
  after insert on public.visitas
  for each row execute function public.log_visita_change();

drop trigger if exists trg_visita_log_update on public.visitas;
create trigger trg_visita_log_update
  after update on public.visitas
  for each row execute function public.log_visita_change();
