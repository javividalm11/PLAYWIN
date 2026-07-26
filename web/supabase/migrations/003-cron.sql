-- ═══════════════════════════════════════════════════════════
-- Migración 003 — Cron de PLAYWIN (cada 30 minutos)
-- Liquida picks pendientes y siembra la cartelera del día, por lotes.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Si ya existía, lo reemplaza
select cron.unschedule('playwin-backfill')
where exists (select 1 from cron.job where jobname = 'playwin-backfill');

select cron.schedule(
  'playwin-backfill',
  '*/30 * * * *',
  $$
  select net.http_get(
    url := 'https://playwin.javividalm11.workers.dev/api/admin/backfill?secret=pwcron_725b334bf3bf5cb6b184984bd961a011172019e89c05d400'
  );
  $$
);
