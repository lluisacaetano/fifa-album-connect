// Troca as fotos (headshots pequenos da API-Football) por CUTOUTS de alta
// qualidade da TheSportsDB — PNG recortado com fundo transparente.
// Casa por nome e confere a nacionalidade pra evitar jogador errado.
// Resumível (cacheia cada busca) e gratuito (não usa a cota da API-Football).
//
//   node scripts/fetch-photos.mjs            # todas as seleções
//   ONLY=br,ar node scripts/fetch-photos.mjs # só algumas
//
// Mantém a foto da API-Football como fallback em p.photoApi.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const KEY = process.env.TSDB_KEY ?? "123";
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;
const CACHE = "/tmp/apif/tsdb";
mkdirSync(CACHE, { recursive: true });

const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const THROTTLE = Number(process.env.THROTTLE_MS ?? 1600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const wc = JSON.parse(readFileSync(new URL("../src/data/worldcup.json", import.meta.url)));
const nationalityByCode = {};
for (const t of Object.values(wc.teams)) {
  const code = t.flag.match(/flagcdn\.com\/w80\/(.+)\.png/)[1];
  nationalityByCode[code] = t.name_en;
}
// Como a TheSportsDB grafa algumas nacionalidades.
const NAT_ALIAS = {
  "United States": ["USA", "United States"],
  "South Korea": ["Korea Republic", "South Korea"],
  "Ivory Coast": ["Ivory Coast", "Cote d'Ivoire"],
  "Czech Republic": ["Czech Republic", "Czechia"],
  "Democratic Republic of the Congo": ["DR Congo", "Congo DR", "Democratic Republic of the Congo"],
  "Cape Verde": ["Cape Verde", "Cabo Verde"],
  "Curaçao": ["Curacao", "Curaçao"],
};

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");

async function search(name) {
  const file = `${CACHE}/${slug(name)}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file));
  // Retry com backoff: a TheSportsDB às vezes devolve HTML de rate-limit.
  for (let attempt = 0; attempt < 5; attempt++) {
    await sleep(THROTTLE + attempt * 4000);
    try {
      const res = await fetch(`${BASE}/searchplayers.php?p=${encodeURIComponent(name)}`);
      const text = await res.text();
      if (!text.trim().startsWith("{")) { if (attempt === 0) console.error(`  … rate-limit TSDB, retry (${name})`); continue; }
      const json = JSON.parse(text);
      writeFileSync(file, JSON.stringify(json));
      return json;
    } catch (e) { if (attempt === 4) console.error("  ! fetch", name, e.message); }
  }
  return null; // sem sucesso: não marca como feito, tenta de novo na próxima leva
}

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// Confere se o nome da TheSportsDB bate com o (abreviado) da API-Football:
// sobrenome igual + primeira inicial igual. Rejeita xará ("E. Fernández" != "Federico").
function nameMatches(apiName, fullName) {
  const tokens = apiName.split(/\s+/).filter(Boolean);
  const surname = norm(tokens[tokens.length - 1]);
  const f = norm(fullName);
  if (surname.length < 3 || !f.includes(surname)) return false;
  const first = tokens[0];
  const fFirst = norm(fullName.split(/\s+/)[0]);
  if (/^\p{Lu}\.?$/u.test(first) && first.length <= 2) {
    return fFirst.startsWith(norm(first[0])); // inicial abreviada
  }
  return f.includes(norm(first)); // primeiro nome por extenso
}

function pickImage(players, natEn, apiName) {
  if (!players || !players.length) return null;
  const wanted = NAT_ALIAS[natEn] ?? [natEn];
  // ESTRITO: mesma nacionalidade E nome compatível (inicial + sobrenome).
  const cands = players.filter((p) => wanted.includes(p.strNationality) && nameMatches(apiName, p.strPlayer));
  for (const p of cands) {
    const img = p.strCutout || p.strRender || p.strThumb;
    if (img) {
      const club = p.strTeam && p.strTeam !== natEn && !/national|seleç/i.test(p.strTeam) ? p.strTeam : null;
      return { img, isCutout: !!(p.strCutout || p.strRender), nat: p.strNationality, club, fullName: p.strPlayer };
    }
  }
  return null;
}

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
let hit = 0, miss = 0, total = 0;

for (const [code, squad] of Object.entries(data)) {
  if (ONLY && !ONLY.includes(code)) continue;
  const natEn = nationalityByCode[code];
  for (const p of squad.players) {
    if (p.photoCustom) continue; // foto manual tem prioridade
    if (p.photoTsdbDone) continue; // resumível
    total++;
    const j = await search(p.name);
    if (j === null) { console.error(`  ⏭  ${code} ${p.name}: TSDB indisponível, tenta na próxima leva`); continue; } // não marca feito
    const got = pickImage(j.player, natEn, p.nameApi ?? p.name);
    if (got) {
      if (p.photoApi === undefined) p.photoApi = p.photo; // guarda fallback
      p.photo = got.img;
      p.photoCutout = got.isCutout;
      if (got.club && !p.club) p.club = got.club; // clube de graça via TheSportsDB
      // Nome completo p/ exibição (a API-Football abrevia: "S. Giménez").
      if (got.fullName && /^\p{Lu}\.\s/u.test(p.name)) { p.nameApi = p.name; p.name = got.fullName; }
      hit++;
      console.log(`✓ ${code.padEnd(7)} ${(got.fullName || p.name).padEnd(24)} ${got.isCutout ? "cutout" : "thumb"}${got.club ? " · " + got.club : ""} (${got.nat})`);
    } else {
      // Sem match confiável: desfaz qualquer foto/nome de rodada anterior (frouxa).
      if (p.photoApi !== undefined) { p.photo = p.photoApi; delete p.photoApi; }
      if (p.nameApi !== undefined) { p.name = p.nameApi; delete p.nameApi; }
      delete p.photoCutout;
      miss++;
      console.log(`– ${code.padEnd(7)} ${p.name.padEnd(24)} sem imagem (mantém foto da API)`);
    }
    p.photoTsdbDone = true;
    if (total % 25 === 0) writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1)); // salva progresso
  }
}

writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`\n${hit} com cutout/thumb · ${miss} sem (usam foto da API) · ${total} processados nesta leva.`);
