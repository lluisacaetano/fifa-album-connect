// Preenche a DESCRIÇÃO de cada jogador com o resumo da Wikipédia em PT
// (é o texto que o Google mostra no painel "sobre"). Grátis, sem chave.
// SEMPRE confirma que o resultado é de um FUTEBOLISTA (evita xará de outra área).
// Resumível (cacheia) + throttle + salva progresso.
//
//   node scripts/enrich-wikipedia.mjs
//   ONLY=br node scripts/enrich-wikipedia.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const CACHE = "/tmp/apif/wiki";
mkdirSync(CACHE, { recursive: true });
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const THROTTLE = Number(process.env.THROTTLE_MS ?? 400);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const wc = JSON.parse(readFileSync(new URL("../src/data/worldcup.json", import.meta.url)));
const natByCode = {};
for (const t of Object.values(wc.teams)) natByCode[t.flag.match(/w80\/(.+)\.png/)[1]] = t.name;

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
const FOOT_RE = /futebol|futebolista|jogador de futebol|football|footballer|soccer/i;

async function getJSON(url, cacheKey) {
  const file = `${CACHE}/${cacheKey}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file));
  for (let a = 0; a < 3; a++) {
    await sleep(THROTTLE + a * 1500);
    try {
      const res = await fetch(url, { headers: { "user-agent": "fifa-album-2026/1.0 (academic project)" } });
      const text = await res.text();
      if (!text.trim().startsWith("{")) continue;
      const j = JSON.parse(text);
      writeFileSync(file, JSON.stringify(j));
      return j;
    } catch { /* retry */ }
  }
  return null;
}

// Resumo de um título específico, validando que é futebolista.
async function summaryOf(title) {
  const j = await getJSON(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, `sum_${slug(title)}`);
  if (!j || j.type === "disambiguation" || !j.extract) return null;
  const blob = `${j.extract} ${j.description ?? ""}`;
  if (!FOOT_RE.test(blob)) return null; // NÃO é futebolista -> rejeita
  return j.extract.trim();
}

// Busca candidatos e devolve o 1º que for futebolista.
async function findFootballerDesc(name) {
  // 1) tenta o título direto
  const direct = await summaryOf(name);
  if (direct) return direct;
  // 2) busca "<nome> futebolista"
  const sr = await getJSON(
    `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + " futebolista")}&srlimit=4&format=json`,
    `search_${slug(name)}`,
  );
  for (const r of sr?.query?.search ?? []) {
    const d = await summaryOf(r.title);
    if (d) return d;
  }
  return null;
}

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
let done = 0, miss = 0, n = 0;
for (const [code, squad] of Object.entries(data)) {
  if (ONLY && !ONLY.includes(code)) continue;
  for (const p of squad.players) {
    if (p.wikiDone) continue;
    n++;
    const name = p.nameApi ? p.name : p.name;
    const desc = await findFootballerDesc(name);
    if (desc) { p.desc = desc; p.descSource = "wikipedia"; done++; console.log(`✓ ${code} ${p.name}: ${desc.slice(0, 80)}…`); }
    else { miss++; console.log(`– ${code} ${p.name}: sem Wikipédia de futebolista`); }
    p.wikiDone = true;
    if (n % 20 === 0) writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
  }
}
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`\n${done} descrições da Wikipédia · ${miss} sem · leva de ${n}.`);
