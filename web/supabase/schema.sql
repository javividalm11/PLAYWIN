-- ═══════════════════════════════════════════════════════════════
-- PLAYWIN — Esquema de base de datos (Supabase / Postgres)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

-- ── Perfiles (espejo de auth.users con datos de negocio) ──
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Suscripciones (Paddle) ──
create table if not exists public.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'paddle',
  provider_subscription_id text unique,
  status text not null check (status in ('active', 'past_due', 'canceled', 'paused')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

-- ── Claves de acceso anónimo (IP y fingerprint) para el trial ──
-- key = 'ip:187.190.x.x' o 'fp:uuid'. El trial anónimo corre desde first_seen_at.
create table if not exists public.access_keys (
  key text primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  events_count bigint not null default 0
);

-- ── Eventos de servicio (SOLO acciones de valor: escanear / pronóstico) ──
-- Esto alimenta el dashboard admin: IPs que USAN el servicio, no visitas.
create table if not exists public.service_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  action text not null check (action in ('predict', 'live')),
  match_id text not null,
  ip text not null,
  fingerprint text,
  user_id uuid references public.profiles (id) on delete set null,
  allowed boolean not null default true,
  tier text, -- anon-trial | registered-trial | paid | denied
  user_agent text
);
create index if not exists service_events_ip_idx on public.service_events (ip);
create index if not exists service_events_created_idx on public.service_events (created_at desc);
create index if not exists service_events_user_idx on public.service_events (user_id);

-- ── Vistas para el dashboard admin ──
create or replace view public.admin_ip_stats as
select
  ip,
  min(created_at) as first_use,
  max(created_at) as last_use,
  count(*) as total_events,
  count(*) filter (where allowed) as allowed_events,
  count(distinct match_id) as distinct_matches,
  count(distinct fingerprint) as distinct_fingerprints,
  count(distinct user_id) filter (where user_id is not null) as linked_users,
  max(tier) filter (where user_id is not null) as best_tier
from public.service_events
group by ip;

create or replace view public.admin_user_stats as
select
  p.id,
  p.email,
  p.role,
  p.created_at as registered_at,
  count(e.id) as total_events,
  count(distinct date_trunc('day', e.created_at)) as active_days,
  max(e.created_at) as last_activity,
  exists (
    select 1 from public.subscriptions s
    where s.user_id = p.id
      and s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
  ) as is_paid
from public.profiles p
left join public.service_events e on e.user_id = p.id
group by p.id, p.email, p.role, p.created_at;

-- ── Row Level Security ──
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.access_keys enable row level security;
alter table public.service_events enable row level security;

-- Cada usuario lee su propio perfil y suscripción; nada más.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own subscription" on public.subscriptions;
create policy "own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- access_keys y service_events: solo el service_role (backend) los toca.
-- (Sin policies = denegado para anon/authenticated; service_role las salta.)
