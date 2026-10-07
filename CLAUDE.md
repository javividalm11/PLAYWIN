# PickVerde — Analizador de Apuestas

Plataforma web de análisis/predicción de fútbol (NO es casa de apuestas).
Monetización: trial 3 días por IP+fingerprint → +2 días al registrarse → $9 USD/mes (Paddle).

> Marca: el proyecto se llamaba **PLAYWIN**; se renombró a **PickVerde** ("verde" = pick
> acertado en jerga apostadora). El repo y la carpeta raíz conservan el nombre antiguo.

## Estructura del repo

- `web/` — app Next.js 16 (App Router, TS, Tailwind v4). **Todo el desarrollo ocurre aquí.**
  Ver `web/README.md` para setup y `web/AGENTS.md` (⚠️ Next 16 tiene breaking changes:
  params asíncronos, `proxy.ts` en vez de middleware, fetch sin caché por defecto).
- `assets/` — logos fuente (logo.png, logotext.png). Los derivados se generan con
  `node web/scripts/prepare-brand.mjs`.

## Comandos

```bash
cd web
npm run dev     # dev server puerto 3000
npm run build   # build + typecheck (verificar SIEMPRE antes de dar por terminado)
```

## Claves de arquitectura

- **Datos deportivos**: API no oficial de ESPN (gratis) vía `web/src/lib/data/espn.ts`,
  con caché de Next (`next.revalidate`) por endpoint. Clima: Open-Meteo. Los endpoints
  fueron validados con `web/scripts/probe-espn*.mjs` — si ESPN cambia, sondear de nuevo.
  Ids de liga → nombres en español: `league-names.ts` (regenerar con `discover-leagues.mjs`).
- **Predicción**: `web/src/lib/prediction/` — Poisson por forma reciente + mezcla con
  probabilidades implícitas de cuotas (de-vig) + ajustes por clima y dominio en vivo.
  Explicaciones en español por plantillas (diseñado para sustituir por API de Claude).
- **Acción monetizable**: POST `/api/predict` (botón "Escanear partido"). El gating y el
  log de IP/fingerprint viven en `web/src/lib/access/gate.ts`. La cookie `pw_fp` se
  siembra en `web/src/proxy.ts`.
- **Supabase**: esquema en `web/supabase/schema.sql`. Sin llaves en `.env.local` la app
  corre en "modo dev" (acceso abierto, sin auth). Clientes en `web/src/lib/supabase/`.
- **Panel del usuario**: `/dashboard` — registro manual de apuestas propias con balance,
  ROI y tasa de acierto calculados sobre las filas guardadas (nunca cifras de ejemplo).
  Tabla `user_bets` con RLS en `web/supabase/migrations/004-bet-tracker.sql`;
  CRUD en `web/src/app/api/bets/route.ts`.
- **Admin**: `/admin` — IPs que usan el servicio (no visitas), usuarios, días, pagos.
  Acceso por rol en profiles o `ADMIN_EMAILS`.

## Diseño

Tema oscuro fijo estilo "trading terminal deportivo" — tokens en `web/src/app/globals.css`:
fondo `#0D0F0D` (escala `pitch-*`), verde marca `#8CC63E→#A4E100` (`brand-*`),
plata (`silver-*`). **El verde es muy claro: sobre `bg-brand-*` sólido el texto va en
`text-pitch-950`, nunca `text-white`.**

- Logo: SVG inline en `web/src/components/brand-mark.tsx` (`BrandMark` / `BrandLockup`),
  hereda color por `currentColor`. Sustituye al antiguo `public/brand/wordmark.png`.
- Tipografía: Manrope (UI), Instrument Serif (titulares `h1`/`h2`), Inter (cuerpo),
  Cabin (botones del hero). Se cargan por `@import` de Google Fonts en `globals.css`,
  no con `next/font`, porque el build falla sin salida a internet.
- Hero de portada (`components/home-hero.tsx`): fondo generativo en CSS puro
  (`.hero-canvas` + `.hero-grid` + `.hero-veil`), sin vídeo ni assets externos.
- Cabeceras de sección: `components/page-heading.tsx`.

Textos de producto en español. Disclaimer 18+ obligatorio en el footer.

## Verificación

- `npm run build` debe pasar limpio (typecheck incluido).
- Visual: `node scripts/check-design.mjs [/ruta]` con dev server corriendo (Edge headless);
  captura escritorio + móvil en `.screenshots/` y reporta errores de consola y
  desbordamiento horizontal.
- E2E del flujo de negocio: `node scripts/test-scan-flow.mjs`.
- Acentos: el repo es UTF-8. Editar `.tsx` con scripts de PowerShell puede introducir
  mojibake (`PronÃ³sticos`); buscar `Ã` antes de dar por cerrado un cambio.
