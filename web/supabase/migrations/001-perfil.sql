-- ═══════════════════════════════════════════════════════════
-- Migración 001 — Perfil de usuario (foto, nombre, ajustes, historial)
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists display_name text,
  add column if not exists avatar_url text;

-- Etiqueta legible del partido en el historial ("Necaxa vs Atlante")
alter table public.service_events
  add column if not exists match_label text;
