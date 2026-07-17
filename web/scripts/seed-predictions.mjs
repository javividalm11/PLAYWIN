/**
 * Siembra el track record: pide a la app un pronóstico de cada partido
 * PROGRAMADO de hoy (POST /api/predict) → recordPrediction() los congela.
 */
const UA = { headers: { "User-Agent": "Mozilla/5.0" } };
const d = process.argv[2] ?? new Date().toLocaleDateString("en-CA").replace(/-/g, "");

const sb = await fetch(
  `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${d}&limit=400`,
  UA,
).then((r) => r.json());

const scheduled = (sb.events ?? []).filter(
  (e) => (e.competitions?.[0]?.status ?? e.status)?.type?.state === "pre",
);
console.log(`Partidos programados hoy: ${scheduled.length}`);

let ok = 0,
  fail = 0;
const queue = [...scheduled];
async function worker() {
  while (queue.length) {
    const e = queue.shift();
    try {
      const res = await fetch("http://localhost:3000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: e.id }),
      });
      if (res.ok) {
        const j = await res.json();
        ok++;
        console.log(
          `  ✓ ${j.match.home.name} vs ${j.match.away.name} → ${j.prediction.pick.selection} (${j.prediction.pick.probability}%)`,
        );
      } else {
        fail++;
      }
    } catch {
      fail++;
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`\nRegistrados: ${ok} · fallidos: ${fail}`);
