// Puxa o NOME COMPLETO de cada jogador (a /players/squads abrevia: "S. Giménez")
// via /players?team=ID&season=SEASON — o que destrava o casamento dos cutouts
// hi-res na TheSportsDB. De quebra, grava as estatísticas da temporada pela seleção.
// Resumível (cacheia cada página) e com throttle (limite 10/min, 100/dia).
//
//   APIFOOTBALL_KEY=xxxx node scripts/fetch-fullnames.mjs
//   MAX_REQUESTS=80 SEASON=2024 ONLY=br,ar ...
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const KEY = process.env.APIFOOTBALL_KEY;
if (!KEY) throw new Error("Defina APIFOOTBALL_KEY");
const BASE = "https://v3.football.api-sports.io";
const CACHE = "/tmp/apif";
mkdirSync(CACHE, { recursive: true });

const MAX_REQUESTS = Number(process.env.MAX_REQUESTS ?? 80);
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
    if (json.errors?.rateLimit) { console.error("  … rate-limit, esperando 60s"); await sleep(60000); continue; }
    if (!hasErr(json)) writeFileSync(file, JSON.stringify(json));
    return json;
  }
  throw new Error("__BUDGET__");
}

const sum = (blocks, f) => blocks.reduce((n, s) => n + (f(s) ?? 0), 0);

const teamIds = JSON.parse(readFileSync(`${CACHE}/teamids.json`));
const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
let named = 0, budgetHit = false;

outer: for (const [code, squad] of Object.entries(data)) {
  if (ONLY && !ONLY.includes(code)) continue;
  if (squad.players.every((p) => p.nameApi)) continue; // time já processado
  const teamId = teamIds[code];
  if (!teamId) { console.error(`  ! sem teamId para ${code}`); continue; }

  // Mapa apifId -> { fullName, goals, assists, apps } juntando todas as páginas.
  const profile = {};
  try {
    let page = 1, totalPages = 1;
    do {
      const j = await api(`/players?team=${teamId}&season=${SEASON}&page=${page}`, `tp_${code}_s${SEASON}_p${page}`);
      totalPages = j.paging?.total ?? 1;
      for (const r of j.response || []) {
        const full = [r.player.firstname, r.player.lastname].filter(Boolean).join(" ").trim() || r.player.name;
        const st = r.statistics || [];
        profile[r.player.id] = {
          fullName: full,
          apps: sum(st, (s) => s.games?.appearences),
          goals: sum(st, (s) => s.goals?.total),
          assists: sum(st, (s) => s.goals?.assists),
        };
      }
      page++;
    } while (page <= totalPages);
  } catch (e) {
    if (e.message === "__BUDGET__") { budgetHit = true; }
    else throw e;
  }

  // Aplica no elenco (casa por apifId).
  for (const p of squad.players) {
    const pr = profile[p.apifId];
    if (!pr) continue;
    if (/^\p{Lu}\.\s/u.test(p.name) && pr.fullName) { p.nameApi = p.name; p.name = pr.fullName; named++; }
    else if (!p.nameApi) p.nameApi = p.name;
    if (p.apps == null) { p.apps = pr.apps; p.goals = pr.goals; p.assists = pr.assists; }
  }
  console.log(`✓ ${code.padEnd(7)} ${squad.name.padEnd(22)} ${Object.keys(profile).length} perfis  (req ${reqCount})`);
  if (budgetHit) break outer;
}

writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
const withFull = Object.values(data).reduce((n, s) => n + s.players.filter((p) => p.nameApi).length, 0);
const tot = Object.values(data).reduce((n, s) => n + s.players.length, 0);
console.log(`\n${named} nomes expandidos nesta leva · ${withFull}/${tot} jogadores com nome processado · ${reqCount} requisições.`);
if (budgetHit) console.log("Limite atingido — rode de novo amanhã para continuar.");
