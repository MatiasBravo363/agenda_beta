-- =============================================================
-- Agenda_BETA :: 004 — last_sign_in_at en usuarios
-- Espeja auth.users.last_sign_in_at a public.usuarios vía trigger.
-- =============================================================

alter table public.usuarios
  add column if not exists last_sign_in_at timestamptz;

create or replace function public.sync_last_sign_in()
returns trigger language plpgsql security definer as $$
begin
  update public.usuarios
    set last_sign_in_at = new.last_sign_in_at
    where id = new.id;
  return new;
end; $$;

drop trigger if exists trg_auth_last_sign_in on auth.users;
create trigger trg_auth_last_sign_in
  after update of last_sign_in_at on auth.users
  for each row execute function public.sync_last_sign_in();

-- Backfill opcional (dejar comentado o ejecutar manualmente):
-- update public.usuarios u
--   set last_sign_in_at = (select last_sign_in_at from auth.users where id = u.id);
