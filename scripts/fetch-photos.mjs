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
  await sleep(THROTTLE);
  let json = { player: null };
  try {
    const res = await fetch(`${BASE}/searchplayers.php?p=${encodeURIComponent(name)}`);
    json = await res.json();
  } catch (e) { console.error("  ! fetch", name, e.message); return null; }
  writeFileSync(file, JSON.stringify(json));
  return json;
}

function pickImage(players, natEn) {
  if (!players || !players.length) return null;
  const wanted = NAT_ALIAS[natEn] ?? [natEn];
  // Prefere mesma nacionalidade; senão usa o primeiro resultado.
  const sameNat = players.filter((p) => wanted.includes(p.strNationality));
  const cands = sameNat.length ? sameNat : players;
  for (const p of cands) {
    const img = p.strCutout || p.strRender || p.strThumb;
    if (img) return { img, isCutout: !!(p.strCutout || p.strRender), nat: p.strNationality };
  }
  return null;
}

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
let hit = 0, miss = 0, total = 0;

for (const [code, squad] of Object.entries(data)) {
  if (ONLY && !ONLY.includes(code)) continue;
  const natEn = nationalityByCode[code];
  for (const p of squad.players) {
    if (p.photoTsdbDone) continue; // resumível
    total++;
    const j = await search(p.name);
    const got = j ? pickImage(j.player, natEn) : null;
    if (got) {
      if (p.photoApi === undefined) p.photoApi = p.photo; // guarda fallback
      p.photo = got.img;
      p.photoCutout = got.isCutout;
      hit++;
      console.log(`✓ ${code.padEnd(7)} ${p.name.padEnd(24)} ${got.isCutout ? "cutout" : "thumb"} (${got.nat})`);
    } else {
      miss++;
      console.log(`– ${code.padEnd(7)} ${p.name.padEnd(24)} sem imagem (mantém foto atual)`);
    }
    p.photoTsdbDone = true;
  }
}

writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`\n${hit} com cutout/thumb · ${miss} sem (usam foto da API) · ${total} processados nesta leva.`);
