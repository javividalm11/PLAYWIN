/** Descubre los ids numéricos de liga de ESPN y genera el mapa TS id→nombre. */
const SLUGS = [
  "eng.1", "eng.2", "eng.fa", "eng.league_cup",
  "esp.1", "esp.2", "esp.copa_del_rey",
  "ita.1", "ita.2", "ita.coppa_italia",
  "ger.1", "ger.2", "ger.dfb_pokal",
  "fra.1", "fra.2", "ned.1", "por.1", "sco.1", "bel.1", "tur.1", "gre.1", "sui.1", "den.1", "swe.1", "nor.1", "rus.1",
  "mex.1", "mex.2", "usa.1", "usa.open",
  "arg.1", "bra.1", "col.1", "chi.1", "per.1", "ecu.1", "uru.1", "par.1", "bol.1", "ven.1",
  "uefa.champions", "uefa.europa", "uefa.europa.conf", "uefa.champions_qual", "uefa.super_cup",
  "conmebol.libertadores", "conmebol.sudamericana", "concacaf.champions", "concacaf.leagues.cup", "concacaf.gold",
  "fifa.world", "fifa.friendly", "fifa.cwc",
  "ksa.1", "jpn.1", "aus.1", "chn.1", "idn.1", "ind.1", "rsa.1", "egy.1", "mar.1",
];

const out = {};
for (const slug of SLUGS) {
  try {
    const r = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!r.ok) { console.error(`-- ${slug}: HTTP ${r.status}`); continue; }
    const d = await r.json();
    const l = d.leagues?.[0];
    if (l?.id && l?.name) out[l.id] = { name: l.name, slug };
  } catch (e) {
    console.error(`-- ${slug}: ${e.message}`);
  }
}

console.log("/** Generado por scripts/discover-leagues.mjs */");
console.log("export const LEAGUE_NAMES: Record<string, string> = {");
for (const [id, { name, slug }] of Object.entries(out)) {
  console.log(`  "${id}": ${JSON.stringify(name)}, // ${slug}`);
}
console.log("};");
