-- =============================================================
-- Agenda_BETA :: Migración inicial
-- Crea tablas: usuarios, tecnicos, tipos_actividad, actividades,
-- actividades_historial + RLS básica (un único rol full-access)
-- =============================================================

create extension if not exists "uuid-ossp";

-- ----------------------------
-- usuarios (perfil enlazado a auth.users)
-- ----------------------------
create table if not exists public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  apellido    text not null,
  email       text,
  created_at  timestamptz not null default now()
);

-- Trigger para auto-crear perfil cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuarios (id, nombre, apellido, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'apellido', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------
-- tecnicos
-- ----------------------------
create table if not exists public.tecnicos (
  id               uuid primary key default uuid_generate_v4(),
  nombre           text not null,
  apellidos        text not null,
  rut              text not null unique,
  tipo             text not null check (tipo in ('interno','externo')),
  tecnico_bermann  boolean not null default false,
  region           text,
  activo           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ----------------------------
-- tipos_actividad
-- ----------------------------
create table if not exists public.tipos_actividad (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null unique,
  descripcion  text
);

-- ----------------------------
-- actividades
-- ----------------------------
create table if not exists public.actividades (
  id                  uuid primary key default uuid_generate_v4(),
  nombre_cliente      text not null,
  tipo_actividad_id   uuid references public.tipos_actividad(id) on delete set null,
  tecnico_id          uuid references public.tecnicos(id) on delete set null,
  fecha_inicio        timestamptz,
  fecha_fin           timestamptz,
  ubicacion           text,
  descripcion         text,
  estado              text not null default 'en_cola'
                       check (estado in ('en_cola','coordinado_con_cliente','agendado_con_tecnico','visita_fallida','completada')),
  parent_activity_id  uuid references public.actividades(id) on delete set null,
  created_by          uuid references public.usuarios(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_actividades_fecha_inicio on public.actividades(fecha_inicio);
create index if not exists idx_actividades_tecnico      on public.actividades(tecnico_id);
create index if not exists idx_actividades_estado       on public.actividades(estado);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_actividades_updated on public.actividades;
create trigger trg_actividades_updated
  before update on public.actividades
  for each row execute function public.set_updated_at();

-- ----------------------------
-- actividades_historial
-- ----------------------------
create table if not exists public.actividades_historial (
  id               uuid primary key default uuid_generate_v4(),
  actividad_id     uuid not null references public.actividades(id) on delete cascade,
  estado_anterior  text,
  estado_nuevo     text not null,
  comentario       text,
  usuario_id       uuid references public.usuarios(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists idx_historial_actividad on public.actividades_historial(actividad_id);

-- =============================================================
-- RLS :: MVP con un único rol full-access (cualquier autenticado)
-- =============================================================
alter table public.usuarios                enable row level security;
alter table public.tecnicos                enable row level security;
alter table public.tipos_actividad         enable row level security;
alter table public.actividades             enable row level security;
alter table public.actividades_historial   enable row level security;

-- Política genérica: authenticated puede todo
do $$ declare t text;
begin
  for t in select unnest(array['usuarios','tecnicos','tipos_actividad','actividades','actividades_historial']) loop
    execute format('drop policy if exists "auth_all_%1$s" on public.%1$s', t);
    execute format($f$create policy "auth_all_%1$s" on public.%1$s
      for all to authenticated using (true) with check (true)$f$, t);
  end loop;
end $$;
