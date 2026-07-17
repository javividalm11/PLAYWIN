/**
 * Configuración de OpenNext para Cloudflare Workers.
 * ISR/caché incremental sobre Workers KV (gratis, sin tarjeta).
 * Requiere el binding NEXT_INC_CACHE_KV en wrangler.jsonc:
 *   npx wrangler kv namespace create NEXT_INC_CACHE_KV
 */
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
