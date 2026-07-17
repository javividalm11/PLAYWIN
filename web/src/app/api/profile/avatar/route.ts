/**
 * POST /api/profile/avatar — Sube/reemplaza la foto de perfil.
 * multipart/form-data con campo "file". El cliente ya la redimensionó
 * a 256x256 webp; aquí solo validamos y guardamos en Storage como
 * avatars/{userId}.webp (upsert).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, getCurrentUser } from "@/lib/supabase/server";

const MAX_BYTES = 1024 * 1024; // ya viene redimensionada; 1MB es de sobra
const ALLOWED = ["image/webp", "image/png", "image/jpeg"];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "no_session" }, { status: 401 });
  const db = getAdminSupabase();
  if (!db) return NextResponse.json({ error: "no_configurado" }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "formulario inválido" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "falta el archivo" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Imagen demasiado grande" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const path = `${user.id}.${ext}`;
  const { error: upErr } = await db.storage
    .from("avatars")
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: true,
    });
  if (upErr) {
    return NextResponse.json({ error: "Error al subir: " + upErr.message }, { status: 500 });
  }

  const { data: pub } = db.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`; // cache-busting

  const { error: dbErr } = await db
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (dbErr) {
    const hint = dbErr.message.includes("avatar_url")
      ? "Falta ejecutar supabase/migrations/001-perfil.sql"
      : dbErr.message;
    return NextResponse.json({ error: hint }, { status: 500 });
  }

  return NextResponse.json({ ok: true, avatarUrl });
}
