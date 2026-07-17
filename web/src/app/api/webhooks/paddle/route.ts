/**
 * Webhook de Paddle Billing.
 * Configurar en Paddle → Developer Tools → Notifications:
 *   URL: https://<tu-dominio>/api/webhooks/paddle
 *   Eventos: subscription.activated, subscription.updated, subscription.canceled
 * El user_id de Supabase viaja en custom_data desde el checkout.
 */
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/server";

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(";").map((kv) => kv.split("=") as [string, string]),
  );
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;
  const digest = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(h1, "hex"));
  } catch {
    return false;
  }
}

type PaddleEvent = {
  event_type?: string;
  data?: {
    id?: string;
    status?: string;
    custom_data?: { user_id?: string } | null;
    current_billing_period?: { ends_at?: string } | null;
  };
};

export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook no configurado" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get("paddle-signature"), secret)) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaddleEvent;
  const type = event.event_type ?? "";
  const data = event.data;
  const userId = data?.custom_data?.user_id;
  const subId = data?.id;

  if (!type.startsWith("subscription.") || !subId) {
    return NextResponse.json({ ok: true, ignored: type });
  }

  const db = getAdminSupabase();
  if (!db) {
    return NextResponse.json({ error: "supabase no configurado" }, { status: 503 });
  }

  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    paused: "paused",
    canceled: "canceled",
  };
  const status = statusMap[data?.status ?? ""] ?? "canceled";

  if (userId) {
    await db.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "paddle",
        provider_subscription_id: subId,
        status,
        current_period_end: data?.current_billing_period?.ends_at ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider_subscription_id" },
    );
  } else {
    // Sin user_id en custom_data: actualizamos por id de suscripción si existe
    await db
      .from("subscriptions")
      .update({
        status,
        current_period_end: data?.current_billing_period?.ends_at ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("provider_subscription_id", subId);
  }

  return NextResponse.json({ ok: true });
}
