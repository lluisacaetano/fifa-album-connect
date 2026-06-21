// Enriquece cada jogador com uma DESCRIÇÃO real (em PT) + valor de mercado,
// usando o wrapper público do Transfermarkt (não usa a cota da API-Football).
// Compõe a frase a partir de: posição, idade, clube, local de nascimento, pé,
// altura, valor de mercado e principal título. Casa por nome + idade/nacionalidade.
// Resumível (cacheia busca/perfil) e com throttle (respeita o serviço gratuito).
//
//   node scripts/enrich-tm.mjs            # todas
//   ONLY=br node scripts/enrich-tm.mjs    # uma seleção
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const BASE = "https://transfermarkt-api.fly.dev";
const CACHE = "/tmp/apif/tm";
mkdirSync(CACHE, { recursive: true });
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const THROTTLE = Number(process.env.THROTTLE_MS ?? 1500);
const WITH_ACH = process.env.ACH !== "0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const wc = JSON.parse(readFileSync(new URL("../src/data/worldcup.json", import.meta.url)));
const natByCode = {};
for (const t of Object.values(wc.teams)) natByCode[t.flag.match(/w80\/(.+)\.png/)[1]] = t.name_en;

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
async function get(path, cacheKey) {
  const file = `${CACHE}/${cacheKey}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file));
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(THROTTLE + attempt * 3000);
    try {
      const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
      const text = await res.text();
      if (!text.trim().startsWith("{")) continue; // HTML/erro -> retry
      const j = JSON.parse(text);
      if (!j.error) writeFileSync(file, JSON.stringify(j));
      return j;
    } catch (e) { if (attempt === 3) console.error("  ! fetch", path, e.message); }
  }
  return null;
}

const FOOT = { right: "destro", left: "canhoto", both: "ambidestro" };
function fmtMV(v) {
  if (!v) return null;
  if (v >= 1e6) return `€${(v / 1e6).toFixed(v % 1e6 ? 1 : 0).replace(".", ",")} mi`;
  if (v >= 1e3) return `€${Math.round(v / 1e3)} mil`;
  return `€${v}`;
}

function pickResult(results, natEn, age) {
  if (!results || !results.length) return null;
  const byNat = results.filter((r) => (r.nationalities || []).includes(natEn));
  const pool = byNat.length ? byNat : results;
  // idade bate (±1) desempata xarás
  return pool.find((r) => age != null && Math.abs((r.age ?? -99) - age) <= 1) ?? pool[0];
}

function compose(p, prof, ach) {
  const bits = [];
  let s = p.position;
  if (p.age != null) s += ` de ${p.age} anos`;
  const club = prof.club?.name || p.club;
  if (club) s += `, atua pelo ${club}`;
  bits.push(s + ".");
  const pob = prof.placeOfBirth?.city ? `${prof.placeOfBirth.city}${prof.placeOfBirth.country ? ", " + prof.placeOfBirth.country : ""}` : null;
  const traits = [];
  if (pob) traits.push(`natural de ${pob}`);
  if (FOOT[prof.foot]) traits.push(FOOT[prof.foot]);
  if (prof.height) traits.push(`${(prof.height / 100).toFixed(2).replace(".", ",")} m`);
  if (traits.length) bits.push(traits.join(", ").replace(/^./, (c) => c.toUpperCase()) + ".");
  const mv = fmtMV(prof.marketValue);
  if (mv) bits.push(`Valor de mercado: ${mv}.`);
  if (ach && ach.length) {
    const top = ach.slice(0, 2).map((a) => `${a.count && a.count > 1 ? a.count + "x " : ""}${a.title}`);
    bits.push(`Conquistas: ${top.join(", ")}.`);
  }
  return bits.join(" ");
}

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
let done = 0, miss = 0;
for (const [code, squad] of Object.entries(data)) {
  if (ONLY && !ONLY.includes(code)) continue;
  const natEn = natByCode[code];
  for (const p of squad.players) {
    if (p.tmDone) continue;
    const name = p.nameApi ? p.name : p.name; // usa o melhor nome disponível
    const sr = await get(`/players/search/${encodeURIComponent(name)}`, `s_${slug(name)}`);
    const hit = sr ? pickResult(sr.results, natEn, p.age) : null;
    if (!hit) { p.tmDone = true; miss++; console.log(`– ${code} ${name} (sem TM)`); continue; }
    const prof = await get(`/players/${hit.id}/profile`, `p_${hit.id}`);
    const ach = WITH_ACH ? (await get(`/players/${hit.id}/achievements`, `a_${hit.id}`))?.achievements : null;
    if (prof && !prof.error) {
      p.desc = compose(p, prof, ach);
      if (prof.marketValue) p.marketValue = prof.marketValue;
      if (prof.fullName && /^\p{Lu}\.\s/u.test(p.name)) { p.nameApi = p.name; p.name = prof.fullName; }
      done++;
      console.log(`✓ ${code} ${p.name} :: ${p.desc.slice(0, 90)}…`);
    } else miss++;
    p.tmDone = true;
  }
}
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`\n${done} descrições · ${miss} sem TM nesta leva.`);
