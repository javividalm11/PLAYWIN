const UA = { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } };
const j = (u) => fetch(u, UA).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))));

// a) forma completa de un resultado de equipo en search v2
const s = await j("https://site.web.api.espn.com/apis/search/v2?query=real%20madrid&limit=3");
const teamGroup = (s.results ?? []).find((g) => g.type === "team");
console.log("== search team content[0] ==");
console.log(JSON.stringify(teamGroup?.contents?.[0], null, 1).slice(0, 1200));

// b) schedule con liga "all"
try {
  const all = await j("https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/86/schedule?fixture=true");
  console.log("\nall/teams/86/schedule OK — events:", all.events?.length);
} catch (e) {
  console.log("\nall/teams/86/schedule FAILED:", e.message);
}

// c) historial temporada pasada
try {
  const hist = await j("https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/schedule?season=2025&fixture=false");
  const ev = hist.events ?? [];
  const last = ev[ev.length - 1];
  console.log("\nseason=2025 played:", ev.length);
  console.log("último:", last?.name, last?.date);
  console.log(
    "score sample:",
    JSON.stringify(
      last?.competitions?.[0]?.competitors?.map((c) => ({
        team: c.team?.abbreviation,
        home: c.homeAway,
        score: c.score?.displayValue ?? c.score,
        winner: c.winner,
      })),
    ),
  );
} catch (e) {
  console.log("season history FAILED:", e.message);
}

// d) lastFiveGames shape del summary
const sb = await j("https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=20260716&limit=400");
const target = (sb.events ?? [])[0];
const sum = await j(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${target.id}`);
console.log("\n== lastFiveGames[0] ==");
const l5 = sum.lastFiveGames?.[0];
console.log("team:", l5?.team?.displayName, "| events:", l5?.events?.length);
console.log(JSON.stringify(l5?.events?.[0], null, 1).slice(0, 700));
console.log("\n== pickcenter[0] ==");
console.log(JSON.stringify(sum.pickcenter?.[0], null, 1).slice(0, 900));
console.log("\n== rosters[0] resumen ==");
const r0 = sum.rosters?.[0];
console.log("team:", r0?.team?.displayName, "| roster entries:", r0?.roster?.length, "| formation:", r0?.formation);
console.log("\n== header.competitions status/venue ==");
const comp = sum.header?.competitions?.[0];
console.log("status:", JSON.stringify(comp?.status), "| date:", comp?.date);
console.log("venue (gameInfo):", sum.gameInfo?.venue?.fullName, "| city:", JSON.stringify(sum.gameInfo?.venue?.address));
