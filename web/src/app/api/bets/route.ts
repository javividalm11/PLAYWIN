import { NextResponse } from "next/server";
import { getCurrentUser, getServerSupabase } from "@/lib/supabase/server";

const statuses = new Set(["pending", "won", "lost", "void"]);

async function context() {
  const [user, db] = await Promise.all([getCurrentUser(), getServerSupabase()]);
  return { user, db };
}

export async function GET() {
  const { user, db } = await context();
  if (!user) return NextResponse.json({ error: "Inicia sesión para ver tus apuestas." }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Configura Supabase para guardar apuestas." }, { status: 503 });
  const { data, error } = await db.from("user_bets").select("id,event_name,selection,stake,odds,status,placed_at").eq("user_id", user.id).order("placed_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: "Activa la migración 004-bet-tracker.sql en Supabase." }, { status: 503 });
  return NextResponse.json({ bets: data });
}

export async function POST(request: Request) {
  const { user, db } = await context();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Datos inválidos." }, { status: 400 }); }
  const eventName = typeof body.eventName === "string" ? body.eventName.trim() : "";
  const selection = typeof body.selection === "string" ? body.selection.trim() : "";
  const stake = Number(body.stake);
  const odds = Number(body.odds);
  if (eventName.length < 2 || eventName.length > 120 || selection.length < 2 || selection.length > 120 || !Number.isFinite(stake) || stake <= 0 || stake > 1000000 || !Number.isFinite(odds) || odds < 1.01 || odds > 1000) return NextResponse.json({ error: "Revisa evento, selección, importe y cuota." }, { status: 400 });
  const { data, error } = await db.from("user_bets").insert({ user_id: user.id, event_name: eventName, selection, stake, odds }).select("id,event_name,selection,stake,odds,status,placed_at").single();
  if (error) return NextResponse.json({ error: "No se pudo guardar. Revisa la migración 004." }, { status: 503 });
  return NextResponse.json({ bet: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { user, db } = await context();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Datos inválidos." }, { status: 400 }); }
  if (typeof body.id !== "string" || !statuses.has(String(body.status))) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  const { data, error } = await db.from("user_bets").update({ status: body.status }).eq("id", body.id).eq("user_id", user.id).select("id,event_name,selection,stake,odds,status,placed_at").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "No se pudo actualizar." }, { status: 404 });
  return NextResponse.json({ bet: data });
}

export async function DELETE(request: Request) {
  const { user, db } = await context();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Datos inválidos." }, { status: 400 }); }
  if (typeof body.id !== "string") return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  const { error } = await db.from("user_bets").delete().eq("id", body.id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
