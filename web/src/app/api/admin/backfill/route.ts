/**
 * POST /api/admin/backfill — Genera el track record del día completo
 * (picks pre-partido reconstruidos + liquidación de los ya terminados).
 * Solo admin (o entorno de desarrollo local).
 */
import { NextResponse, type NextRequest } from "next/server";
import { backfillDay } from "@/lib/predictions/backfill";
import { isCurrentUserAdmin } from "@/lib/access/admin";

export async function POST(request: NextRequest) {
  const isAdmin = await isCurrentUserAdmin();
  const isDev = process.env.NODE_ENV === "development";
  if (!isAdmin && !isDev) {
    return NextResponse.json({ error: "solo admin" }, { status: 403 });
  }

  const date = new URL(request.url).searchParams.get("date") ?? undefined;
  if (date && !/^\d{8}$/.test(date)) {
    return NextResponse.json({ error: "date debe ser YYYYMMDD" }, { status: 400 });
  }

  const result = await backfillDay(date);
  if (!result) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }
  return NextResponse.json(result);
}
