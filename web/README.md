# PLAYWIN — Analizador de Apuestas ⚽📊

Plataforma de análisis y predicción de fútbol: probabilidades pre-match y en vivo,
picks con explicación, trial por IP y suscripción mensual.

## Correr en local

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

Sin configurar nada más, la app corre en **modo dev**: datos deportivos reales,
predicciones funcionando y acceso abierto (sin trial ni auth).

## Activar auth + trial + admin (Supabase)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el Dashboard → **SQL Editor** → pega y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
3. Copia `.env.example` a `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role — **secreta**)
   - `ADMIN_EMAILS` — tu correo para entrar a `/admin`
4. Reinicia `npm run dev`. Regístrate con tu correo admin y entra a `/admin`.

Con esto queda activo: registro/login por correo, trial de 3 días por IP+fingerprint,
+2 días al registrarse, y el dashboard admin con las IPs que usan el servicio.

## Activar pagos (Paddle)

1. Cuenta sandbox en [sandbox-vendors.paddle.com](https://sandbox-vendors.paddle.com).
2. Catalog → Products → crea "PLAYWIN Pro" con precio recurrente mensual de $9 USD.
3. Developer Tools → Authentication → client-side token → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.
4. El price id (`pri_...`) → `NEXT_PUBLIC_PADDLE_PRICE_ID`.
5. Notifications → destino webhook `https://<dominio>/api/webhooks/paddle`
   con eventos `subscription.*` → secret → `PADDLE_WEBHOOK_SECRET`.
   (En local usa `ngrok http 3000` o similar para exponer el webhook.)
6. Para producción: cuenta real de Paddle + aprobación del sitio
   (presentarlo como "plataforma de análisis estadístico deportivo", disclaimer 18+ visible).

## Arquitectura

```
src/
├── app/                    # rutas (App Router, Next 16)
│   ├── api/predict         # ⭐ acción de servicio gateada (POST)
│   ├── api/live/[id]       # snapshot en vivo (polling 45s)
│   ├── api/webhooks/paddle # activación de suscripciones
│   ├── admin/              # dashboard (IPs de uso, usuarios, pagos)
│   ├── partido/[id]        # detalle + panel Escanear
│   └── equipo/[id]         # historial + próximos
├── lib/
│   ├── data/               # ESPN adapter + Open-Meteo + mapa de ligas
│   ├── prediction/         # motor Poisson + mercado + explicación
│   ├── access/             # reglas de trial + gating + admin
│   └── supabase/           # clientes (browser/server/service)
├── proxy.ts                # fingerprint cookie + refresh de sesión
scripts/                    # sondas de API, screenshots, e2e
supabase/schema.sql         # esquema completo de la BD
```

Reglas de acceso ([src/lib/access/config.ts](src/lib/access/config.ts)):
**3 días** anónimo (por IP + fingerprint, el reloj más antiguo manda) →
**+2 días** al registrarse → **$9 USD/mes** (Paddle).

## Scripts útiles

```bash
node scripts/prepare-brand.mjs      # regenerar wordmark/emblema/favicon desde /assets
node scripts/discover-leagues.mjs   # refrescar mapa de ligas ESPN
node scripts/screenshot.mjs /ruta   # capturas (requiere dev server corriendo)
node scripts/test-scan-flow.mjs     # e2e del flujo Escanear
```
