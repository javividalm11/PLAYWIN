/** Crea el bucket público de avatares (idempotente). Usa la service key. */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: buckets } = await db.storage.listBuckets();
if (buckets?.some((b) => b.name === "avatars")) {
  console.log("Bucket 'avatars' ya existe ✅");
} else {
  const { error } = await db.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
  });
  if (error) throw error;
  console.log("Bucket 'avatars' creado ✅ (público, máx 2MB)");
}
