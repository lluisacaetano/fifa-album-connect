// Mescla as estatísticas do dataset do Kaggle (swaptr/fifa-wc-2026-players)
// em squads.generated.json: jogos (games), gols (goals) e assistências (assists).
// Match por NOME (+ clube como desempate de homônimos). Fonte única p/ os 3 cards.
//
//   node scripts/merge-kaggle.mjs            # usa scripts/fifa-wc-2026-players.csv
//   CSV=/caminho/players.csv node scripts/merge-kaggle.mjs
import { readFileSync, writeFileSync } from "node:fs";

const CSV = process.env.CSV ?? "scripts/fifa-wc-2026-players.csv";
const norm = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const clubWords = (s) => norm(s).split(" ").filter((w) => w.length >= 4);

// CSV parser simples (respeita aspas).
function parseLine(l) {
  const out = [];
  let cur = "", q = false;
  for (const c of l) {
    if (c === '"') q = !q;
    else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const lines = readFileSync(CSV, "utf8").trim().split("\n");
const H = lines[0].split(",");
const col = (r, name) => r[H.indexOf(name)];
const rows = lines.slice(1).map(parseLine);

const numOr0 = (v) => (v == null || v === "" ? 0 : Math.round(Number(v)));
// Forma compacta "inicial + sobrenome" (C. Montes / César Montes -> "c montes").
function compact(name) {
  const t = norm(name).split(" ").filter(Boolean);
  if (t.length < 2) return t[0] ?? "";
  return `${t[0][0]} ${t[t.length - 1]}`;
}

const STOP = new Set(["de", "da", "do", "dos", "das", "del", "van", "von", "el", "al"]);
const toks = (s) => norm(s).split(" ").filter((w) => w && !STOP.has(w));
// Um conjunto de tokens está contido no outro? (ex.: "Alisson" ⊆ "Alisson Becker")
function subset(a, b) {
  const A = new Set(a), B = new Set(b);
  const small = A.size <= B.size ? A : B, big = A.size <= B.size ? B : A;
  if (![...small].every((t) => big.has(t))) return false;
  return [...small].some((t) => t.length >= 4); // exige ao menos 1 token distintivo
}

// Índices: nome completo e forma compacta -> linhas (pode haver homônimos).
const byFull = {}, byComp = {};
for (const r of rows) {
  (byFull[norm(col(r, "player"))] ??= []).push(r);
  (byComp[compact(col(r, "player"))] ??= []).push(r);
  r._toks = toks(col(r, "player"));
}

function findRow(name, club, age) {
  let cands = byFull[norm(name)] ?? byComp[compact(name)] ?? [];
  if (cands.length === 0) { // fallback: nome contido no outro (tokens)
    const t = toks(name);
    cands = rows.filter((r) => subset(t, r._toks));
  }
  if (cands.length === 0) return null;
  if (cands.length === 1) return cands[0];
  // homônimo: desempata por clube, depois por ano de nascimento.
  const cw = clubWords(club);
  const byClub = cands.filter((r) => clubWords(col(r, "club")).some((w) => cw.includes(w)));
  if (byClub.length === 1) return byClub[0];
  const pool = byClub.length ? byClub : cands;
  if (age != null) {
    const target = 2026 - age; // aproximado (±1)
    pool.sort((a, b) => Math.abs((Number(col(a, "birth_year")) || 0) - target) - Math.abs((Number(col(b, "birth_year")) || 0) - target));
  }
  return pool[0];
}

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
let hit = 0, miss = 0;
const missing = [];
for (const [code, squad] of Object.entries(data)) {
  if (ONLY && !ONLY.includes(code)) continue;
  for (const p of squad.players) {
    const r = findRow(p.name, p.club, p.age);
    if (r) {
      p.apps = numOr0(col(r, "games"));
      p.goals = numOr0(col(r, "goals"));
      p.assists = numOr0(col(r, "assists"));
      p.statsSource = "kaggle-wc2026";
      hit++;
    } else {
      // sem linha no dataset -> zera p/ manter a tela consistente (0/0/0)
      p.apps = p.apps ?? 0;
      p.goals = p.goals ?? 0;
      p.assists = p.assists ?? 0;
      miss++;
      missing.push(`${code}:${p.name}`);
    }
  }
}
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`${hit} jogadores com stats do Kaggle · ${miss} sem match.`);
if (missing.length) console.log("sem match:\n  " + missing.slice(0, 60).join("\n  ") + (missing.length > 60 ? `\n  … (+${missing.length - 60})` : ""));
