// Baixa os elencos atuais das 48 seleções da Copa 2026 da API-Football (plano grátis).
// Resumível: cacheia cada resposta em /tmp/apif e nunca re-chama o que já tem.
// Respeita o limite diário (para antes de ~95 chamadas/dia).
//
//   APIFOOTBALL_KEY=xxxx node scripts/fetch-squads.mjs
//
// Saída: src/data/squads.generated.json  ->  { "<code>": { name, players:[...] } }
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const KEY = process.env.APIFOOTBALL_KEY;
if (!KEY) throw new Error("Defina APIFOOTBALL_KEY");
const BASE = "https://v3.football.api-sports.io";
const CACHE = "/tmp/apif";
mkdirSync(CACHE, { recursive: true });

// Orçamento de requisições para esta execução (limite grátis = 100/dia).
const MAX_REQUESTS = Number(process.env.MAX_REQUESTS ?? 90);
let reqCount = 0;

// code (flagcdn) -> { name_pt, apifId? }  — IDs já conhecidos da Copa 2022.
const KNOWN = {
  mx: 16, kr: 17, ca: 5529, qa: 1569, ch: 15, br: 6, ma: 31, us: 2384,
  au: 20, de: 25, ec: 2382, nl: 1118, jp: 12, tn: 28, be: 1, ir: 22,
  es: 9, sa: 23, uy: 7, fr: 2, sn: 13, ar: 26, pt: 27, "gb-eng": 10,
  hr: 3, gh: 1504,
};

// code -> nome em inglês para busca (apenas os faltantes).
const SEARCH_NAME = {
  za: "South Africa", cz: "Czechia", ba: "Bosnia", ht: "Haiti",
  "gb-sct": "Scotland", py: "Paraguay", tr: "Turkey", cw: "Curacao",
  ci: "Ivory Coast", se: "Sweden", eg: "Egypt", nz: "New Zealand",
  cv: "Cape Verde", iq: "Iraq", no: "Norway", dz: "Algeria",
  at: "Austria", jo: "Jordan", cd: "Congo DR", uz: "Uzbekistan",
  co: "Colombia", pa: "Panama",
};

const POS = { Goalkeeper: "Goleiro", Defender: "Defesa", Midfielder: "Meio", Attacker: "Ataque" };

const wc = JSON.parse(readFileSync(new URL("../src/data/worldcup.json", import.meta.url)));
const teams = Object.values(wc.teams).map((t) => {
  const code = t.flag.match(/flagcdn\.com\/w80\/(.+)\.png/)[1];
  return { code, name: t.name, name_en: t.name_en };
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const THROTTLE = Number(process.env.THROTTLE_MS ?? 7000); // ~9 req/min (limite é 10/min)
const hasErr = (j) => j.errors && (Array.isArray(j.errors) ? j.errors.length : Object.keys(j.errors).length);

async function api(path, cacheKey) {
  const file = `${CACHE}/${cacheKey}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file)); // cache = só sucessos
  if (reqCount >= MAX_REQUESTS) throw new Error(`__BUDGET__ Limite de ${MAX_REQUESTS} chamadas atingido nesta leva.`);

  for (let attempt = 0; attempt < 4; attempt++) {
    if (reqCount > 0 || attempt > 0) await sleep(THROTTLE);
    reqCount++;
    const res = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": KEY } });
    const json = await res.json();
    const rateLimited = json.errors?.rateLimit;
    if (rateLimited) { console.error(`  … rate-limit, esperando 60s (tentativa ${attempt + 1})`); await sleep(60000); continue; }
    if (hasErr(json)) console.error(`  ! erro em ${path}:`, JSON.stringify(json.errors));
    else writeFileSync(file, JSON.stringify(json)); // só cacheia sucesso
    return json;
  }
  throw new Error(`__BUDGET__ Rate-limit persistente em ${path}.`);
}

async function resolveId(t) {
  if (KNOWN[t.code]) return KNOWN[t.code];
  const q = SEARCH_NAME[t.code] ?? t.name_en;
  const j = await api(`/teams?search=${encodeURIComponent(q)}`, `search_${t.code}`);
  const national = (j.response || []).filter((r) => r.team.national);
  const pick = national[0] ?? (j.response || [])[0];
  if (!pick) { console.error(`  ! sem time para ${t.code} (${q})`); return null; }
  return pick.team.id;
}

// O cache em /tmp/apif torna a execução resumível: numa re-rodada, toda
// seleção já baixada é reconstruída de graça (0 req) e só as novas chamam a API.
const out = {};

let done = 0, budgetHit = false;
for (const t of teams) {
  try {
    const id = await resolveId(t);
    if (!id) continue;
    const j = await api(`/players/squads?team=${id}`, `squad_${t.code}`);
    const sq = (j.response || [])[0];
    if (!sq) { console.error(`  ! sem elenco para ${t.code}`); continue; }
    const players = sq.players.map((p, i) => ({
      id: i + 1,
      apifId: p.id,
      name: p.name,
      position: POS[p.position] ?? p.position,
      number: p.number != null ? String(p.number) : null,
      age: p.age ?? null,
      photo: p.photo ?? null,
    }));
    out[t.code] = { name: t.name, players };
    done++;
    console.log(`✓ ${t.code.padEnd(7)} ${t.name.padEnd(22)} ${players.length} jogadores  (req ${reqCount})`);
  } catch (e) {
    if (String(e.message).startsWith("__BUDGET__")) { console.log("\n" + e.message); budgetHit = true; break; }
    throw e;
  }
}

writeFileSync("src/data/squads.generated.json", JSON.stringify(out, null, 1));

console.log(`\n${done} seleções nesta leva · ${Object.keys(out).length}/48 no total · ${reqCount} requisições usadas.`);
if (budgetHit) console.log("Rode de novo amanhã pra completar as seleções restantes.");
