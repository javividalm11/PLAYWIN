-- ═══════════════════════════════════════════════════════════
-- Migración 002 — Track record de pronósticos
-- Guarda el pick pre-partido de cada partido y su resultado
-- (won/lost/void) para la página pública /resultados.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

create table if not exists public.predictions (
  id bigint generated always as identity primary key,
  match_id text not null unique,
  match_label text not null,
  league text,
  kickoff timestamptz not null,
  market text not null,          -- "1X2" | "Doble oportunidad" | "Over/Under" | "Ambos anotan"
  selection text not null,       -- texto mostrado, ej. "Necaxa o empate (1X)"
  pick_code jsonb not null,      -- pick estructurado para liquidar, ej. {"type":"dc","side":"1x"}
  probability int not null,
  confidence text not null,
  probs jsonb not null,          -- {home,draw,away} al momento del pick
  outcome text not null default 'pending'
    check (outcome in ('pending', 'won', 'lost', 'void')),
  final_score text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists predictions_kickoff_idx on public.predictions (kickoff desc);
create index if not exists predictions_outcome_idx on public.predictions (outcome);

alter table public.predictions enable row level security;

-- El track record es público (transparencia del modelo): solo lectura.
drop policy if exists "public read predictions" on public.predictions;
create policy "public read predictions" on public.predictions
  for select using (true);
-- Escritura: solo service_role (sin policy de insert/update).
