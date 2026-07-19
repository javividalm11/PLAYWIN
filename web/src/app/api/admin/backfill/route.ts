/**
 * POST|GET /api/admin/backfill — Siembra el track record del día completo
 * (picks pre-partido) y liquida los pendientes ya terminados.
 *
 * Acceso: admin logueado, entorno dev, o cron con ?secret=CRON_SECRET
 * (pensado para el job diario programado desde Supabase pg_cron).
 */
import { NextResponse, type NextRequest } from "next/server";
import { backfillDay } from "@/lib/predictions/backfill";
import { settlePending } from "@/lib/predictions/store";
import { isCurrentUserAdmin } from "@/lib/access/admin";

async function run(request: NextRequest) {
  const url = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const provided = url.searchParams.get("secret") ?? request.headers.get("x-cron-secret");
  const isCron = Boolean(cronSecret && provided === cronSecret);
  const isDev = process.env.NODE_ENV === "development";

  if (!isCron && !isDev && !(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "solo admin" }, { status: 403 });
  }

  const date = url.searchParams.get("date") ?? undefined;
  if (date && !/^\d{8}$/.test(date)) {
    return NextResponse.json({ error: "date debe ser YYYYMMDD" }, { status: 400 });
  }

  // 1. Liquidar pendientes de días anteriores  2. Sembrar la cartelera del día
  await settlePending();
  const result = await backfillDay(date);
  if (!result) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  return run(request);
}

// GET para pg_net/http de Supabase y servicios de cron simples
export async function GET(request: NextRequest) {
  return run(request);
}
