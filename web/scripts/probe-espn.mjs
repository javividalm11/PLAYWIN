/** Sondeo de la API no oficial de ESPN para validar estructuras antes de escribir adapters */
const UA = { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } };
const j = (u) => fetch(u, UA).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status} ${u}`))));

const date = process.argv[2] ?? "20260716";

// 1. Scoreboard global de hoy
const sb = await j(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${date}&limit=400`);
const events = sb.events ?? [];
console.log(`\n== SCOREBOARD: ${events.length} eventos ==`);
for (const e of events.slice(0, 6)) {
  const c = e.competitions?.[0];
  const league = e.season?.slug ?? c?.type?.abbreviation ?? "?";
  console.log(`- [${e.id}] ${e.name} | status=${e.status?.type?.state} | league=${sb.leagues?.[0]?.name ?? league} | odds=${!!c?.odds?.length}`);
}
// ligas presentes
const leagueSet = new Set(events.map((e) => e.leagueName ?? "n/a"));
console.log("league keys in event:", Object.keys(events[0] ?? {}).join(","));

// 2. Detalle (summary) del primer evento en vivo o programado
const target = events.find((e) => e.status?.type?.state === "in") ?? events[0];
if (target) {
  // La liga viene en el uid s:600~l:<leagueId>; el endpoint summary requiere slug de liga.
  // Probamos con "all" y con el slug real si existe.
  console.log(`\n== SUMMARY del evento ${target.id} (${target.name}) ==`);
  try {
    const sum = await j(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${target.id}`,
    );
    console.log("keys:", Object.keys(sum).join(", "));
    console.log("boxscore.teams stats:", sum.boxscore?.teams?.[0]?.statistics?.slice(0, 6).map((s) => s.name).join(","));
    console.log("rosters (alineaciones):", Array.isArray(sum.rosters), "entries:", sum.rosters?.length);
    console.log("headToHeadGames:", Array.isArray(sum.headToHeadGames), sum.headToHeadGames?.length);
    console.log("gameInfo.venue:", sum.gameInfo?.venue?.fullName, "| weather:", JSON.stringify(sum.gameInfo?.weather ?? null));
    console.log("odds:", JSON.stringify(sum.odds?.[0]?.details ?? null), "| probability keys:", sum.winprobability ? "yes" : "no");
    console.log("form:", sum.form?.map((f) => `${f.team?.abbreviation}:${f.events?.length} prev`).join(" "));
  } catch (e) {
    console.log("summary all failed:", e.message);
  }
}

// 3. Búsqueda de equipos
console.log("\n== SEARCH 'real madrid' ==");
try {
  const s = await j(`https://site.web.api.espn.com/apis/search/v2?query=real%20madrid&limit=5`);
  for (const g of s.results ?? []) {
    console.log(`- group: ${g.type}: ${(g.contents ?? []).slice(0, 3).map((c) => `${c.displayName} [uid=${c.uid}]`).join(" | ")}`);
  }
} catch (e) {
  console.log("search v2 failed:", e.message);
}

// 4. Schedule de un equipo (Real Madrid id=86 en ESPN)
console.log("\n== TEAM SCHEDULE Real Madrid (esp.1, id 86) ==");
try {
  const sch = await j(`https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?fixture=true`);
  console.log("próximos:", sch.events?.length, "| primer evento:", sch.events?.[0]?.name, sch.events?.[0]?.date);
  const res = await j(`https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?fixture=false`);
  const past = res.events ?? [];
  const last = past[past.length - 1];
  console.log("jugados:", past.length, "| último:", last?.name, last?.date, "| score keys:", JSON.stringify(last?.competitions?.[0]?.competitors?.map((c) => ({ t: c.team?.abbreviation, s: c.score?.value ?? c.score }))));
} catch (e) {
  console.log("schedule failed:", e.message);
}
