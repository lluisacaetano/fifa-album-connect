// Enriquece os jogadores de squads.generated.json com clube e estatísticas
// da temporada (gols, assistências, jogos) via API-Football.
// Custa 1 chamada por jogador -> roda em levas dentro do limite de 100/dia.
// Resumível: pula quem já tem clube preenchido; cacheia cada jogador em /tmp/apif.
//
//   APIFOOTBALL_KEY=xxxx node scripts/enrich-stats.mjs
//
// Variáveis: MAX_REQUESTS (padrão 85), SEASON (padrão 2024), ONLY=br,ar (limita seleções)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const KEY = process.env.APIFOOTBALL_KEY;
if (!KEY) throw new Error("Defina APIFOOTBALL_KEY");
const BASE = "https://v3.football.api-sports.io";
const CACHE = "/tmp/apif";
mkdirSync(CACHE, { recursive: true });

const MAX_REQUESTS = Number(process.env.MAX_REQUESTS ?? 85);
const SEASON = Number(process.env.SEASON ?? 2024);
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const THROTTLE = Number(process.env.THROTTLE_MS ?? 7000);
let reqCount = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hasErr = (j) => j.errors && (Array.isArray(j.errors) ? j.errors.length : Object.keys(j.errors).length);

async function api(path, cacheKey) {
  const file = `${CACHE}/${cacheKey}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file));
  if (reqCount >= MAX_REQUESTS) throw new Error("__BUDGET__");
  for (let attempt = 0; attempt < 4; attempt++) {
    if (reqCount > 0 || attempt > 0) await sleep(THROTTLE);
    reqCount++;
    const res = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": KEY } });
    const json = await res.json();
    if (json.errors?.rateLimit) { console.error(`  … rate-limit, esperando 60s`); await sleep(60000); continue; }
    if (!hasErr(json)) writeFileSync(file, JSON.stringify(json));
    return json;
  }
  throw new Error("__BUDGET__");
}

// Soma o que o jogador fez pelo CLUBE na temporada (exclui seleção: clubes jogam em ligas).
function clubStats(statistics) {
  const leagueBlock = statistics
    .filter((s) => s.league?.type === "League")
    .sort((a, b) => (b.games?.appearences ?? 0) - (a.games?.appearences ?? 0))[0];
  if (!leagueBlock) return null;
  const clubId = leagueBlock.team.id;
  const blocks = statistics.filter((s) => s.team.id === clubId);
  const sum = (f) => blocks.reduce((n, s) => n + (f(s) ?? 0), 0);
  return {
    club: leagueBlock.team.name,
    apps: sum((s) => s.games?.appearences),
    goals: sum((s) => s.goals?.total),
    assists: sum((s) => s.goals?.assists),
  };
}

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
let enriched = 0, budgetHit = false;

outer: for (const [code, squad] of Object.entries(data)) {
  if (ONLY && !ONLY.includes(code)) continue;
  for (const p of squad.players) {
    if (p.club !== undefined && p.club !== null) continue; // já enriquecido
    if (!p.apifId) continue;
    try {
      const j = await api(`/players?id=${p.apifId}&season=${SEASON}`, `player_${p.apifId}_${SEASON}`);
      const r = (j.response || [])[0];
      const st = r ? clubStats(r.statistics || []) : null;
      if (st) {
        Object.assign(p, st);
        enriched++;
        console.log(`✓ ${code.padEnd(7)} ${p.name.padEnd(24)} ${st.club} · ${st.goals}g ${st.assists}a ${st.apps}j  (req ${reqCount})`);
      } else {
        p.club = null; // marca como visto (sem stats nesta temporada) p/ não repetir
        console.log(`– ${code.padEnd(7)} ${p.name.padEnd(24)} sem stats em ${SEASON}`);
      }
    } catch (e) {
      if (e.message === "__BUDGET__") { budgetHit = true; break outer; }
      throw e;
    }
  }
}

writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
const total = Object.values(data).reduce((n, s) => n + s.players.length, 0);
const withClub = Object.values(data).reduce((n, s) => n + s.players.filter((p) => p.club).length, 0);
console.log(`\n${enriched} enriquecidos nesta leva · ${withClub}/${total} com clube/stats · ${reqCount} requisições.`);
if (budgetHit) console.log("Limite atingido — rode de novo amanhã para continuar.");
