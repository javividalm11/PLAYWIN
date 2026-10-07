-- Registro privado de apuestas manuales. Las cifras del panel salen de estas filas.
create table if not exists public.user_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (char_length(event_name) between 2 and 120),
  selection text not null check (char_length(selection) between 2 and 120),
  stake numeric(12,2) not null check (stake > 0 and stake <= 1000000),
  odds numeric(8,3) not null check (odds >= 1.01 and odds <= 1000),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'void')),
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists user_bets_user_date_idx on public.user_bets(user_id, placed_at desc);
alter table public.user_bets enable row level security;
create policy "own bets select" on public.user_bets for select using (auth.uid() = user_id);
create policy "own bets insert" on public.user_bets for insert with check (auth.uid() = user_id);
create policy "own bets update" on public.user_bets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bets delete" on public.user_bets for delete using (auth.uid() = user_id);
