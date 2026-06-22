// Preenche cada jogador com dados da WIKIPÉDIA (PT): a descrição "sobre" + a
// carreira inteira da infobox (idade, altura, pé, número, todos os clubes com
// jogos/gols e a seleção principal). Grátis, sem chave.
//
// SEMPRE confirma que a página é de uma PESSOA futebolista E que o NOME bate
// (evita pegar a página do clube, de um xará ou de outro artigo).
// Resumível (cacheia) + throttle + salva progresso.
//
//   node scripts/enrich-wikipedia.mjs
//   ONLY=br node scripts/enrich-wikipedia.mjs            # só uma seleção
//   ONLY=br FORCE=1 node scripts/enrich-wikipedia.mjs    # refaz mesmo os já feitos
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const CACHE = "/tmp/apif/wiki";
mkdirSync(CACHE, { recursive: true });
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const FORCE = !!process.env.FORCE;
const THROTTLE = Number(process.env.THROTTLE_MS ?? 700);
const TODAY = new Date();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const norm = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const tidy = (t) => t.replace(/\s+/g, " ").trim(); // resumo COMPLETO, só normaliza espaços

// Override manual de título (homônimos que a busca não resolve). Chave "<code>-<número>".
const OVERRIDE = {
  "br-4": "Marcos Aoás Corrêa", // Marquinhos (PSG)
  "br-17": "Fábio Henrique Tavares", // Fabinho
  "br-2": "Éderson José dos Santos Lourenço da Silva", // Éderson (Atalanta)
};

// É uma PESSOA futebolista? (clube diz "clube de futebol"; artigo de seleção, etc.)
const PERSON_RE = /futebolist|jogador de futebol|footballer|soccer player/i;
const NOTPERSON_RE = /\bclube\b|\bequipe\b|sele[çc][aã]o (brasileira|nacional|de futebol)|estádio|temporada|\bciclo\b|campeonato|copa do mundo de|football club|national (football )?team|stadium|\bseason\b/i;

// O clube do jogador aparece no texto? (casa por palavra: "Newcastle United" -> "newcastle")
function clubHit(blob, club) {
  if (!club) return false;
  const b = norm(blob);
  return norm(club).split(/[^a-z0-9]+/).some((w) => w.length >= 4 && b.includes(w));
}

async function getJSON(url, cacheKey) {
  const file = `${CACHE}/${cacheKey}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file));
  for (let a = 0; a < 6; a++) {
    await sleep(THROTTLE + a * 1200);
    try {
      const res = await fetch(url, { headers: { "user-agent": "fifa-album-2026/1.0 (academic project)" } });
      if (res.status === 429) { // rate-limit: respeita o Retry-After (ou espera mais)
        await sleep((Number(res.headers.get("retry-after")) || 5) * 1000);
        continue;
      }
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.trim().startsWith("{")) { await sleep(2000); continue; } // "too many requests" etc.
      const j = JSON.parse(text);
      writeFileSync(file, JSON.stringify(j));
      return j;
    } catch { /* retry */ }
  }
  return null;
}

async function search(query, key, lang) {
  const sr = await getJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=6&format=json`,
    `search_${lang}_${key}`,
  );
  return (sr?.query?.search ?? []).map((r) => r.title);
}

// Resumo de um título (na língua dada); só passa se for PESSOA futebolista.
async function pageOf(title, lang) {
  const j = await getJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, `sum_${lang}_${slug(title)}`);
  if (!j || j.type === "disambiguation" || !j.extract) return null;
  const desc = j.description ?? "";
  if (NOTPERSON_RE.test(desc)) return null; // descrição de clube/seleção/artigo
  if (!PERSON_RE.test(`${desc} ${j.extract}`)) return null; // não é futebolista
  return { title: j.title ?? title, extract: j.extract, desc: tidy(j.extract) };
}

// Traduz EN->PT pelo endpoint público do Google (sem chave). Cacheia.
async function translate(text) {
  if (!text) return text;
  const file = `${CACHE}/tr_${slug(text).slice(0, 60)}_${text.length}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file)).t;
  for (let a = 0; a < 5; a++) {
    await sleep(THROTTLE + a * 1000);
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
      if (!res.ok) continue;
      const arr = JSON.parse(await res.text());
      const t = (arr?.[0] ?? []).map((seg) => seg[0]).join("");
      if (!t) continue;
      writeFileSync(file, JSON.stringify({ t }));
      return t;
    } catch { /* retry */ }
  }
  return text; // se a tradução falhar, mantém o inglês (melhor que nada)
}

// O nome do jogador aparece no título ou no começo do resumo? (a página é DELE?)
function nameMatches(name, page) {
  const first = norm(name).split(/\s+/).find((w) => w.length >= 3);
  if (!first) return true;
  const hay = `${norm(page.title)} ${norm(page.extract).slice(0, 90)}`;
  return hay.includes(first);
}

// Acha a página numa língua: pessoa futebolista + nome bate + (de preferência) clube confere.
async function resolveLang(name, club, forced, lang) {
  if (forced) {
    const page = await pageOf(forced, lang); // título verificado à mão -> confia
    if (page) return page;
  }
  const word = lang === "pt" ? "futebolista" : "footballer";
  const titles = [
    name,
    ...(await search(`${name} ${word} ${club ?? ""}`.trim(), `${slug(name)}-${slug(club ?? "x")}`, lang)),
    ...(await search(`${name} ${word}`, `${slug(name)}-f`, lang)),
  ];
  const seen = new Set();
  let fallback = null;
  for (const title of titles) {
    if (!title || seen.has(title)) continue;
    seen.add(title);
    const page = await pageOf(title, lang);
    if (!page || !nameMatches(name, page)) continue;
    if (clubHit(page.extract, club)) return page; // pessoa certa (clube confere)
    fallback ??= page; // 1º futebolista plausível, caso nenhum bata o clube
  }
  return fallback;
}

// PT primeiro; se não houver página em português, cai pra Wikipédia em INGLÊS.
// Devolve { page, lang } — o chamador traduz quando lang === "en".
async function resolve(name, club, forced) {
  const pt = await resolveLang(name, club, forced, "pt");
  if (pt) return { page: pt, lang: "pt" };
  const en = await resolveLang(name, club, null, "en"); // override é título PT; ignora no EN
  if (en) return { page: en, lang: "en" };
  return null;
}

// ---- INFOBOX: carreira inteira -------------------------------------------------

async function fetchInfobox(title) {
  const j = await getJSON(
    `https://pt.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvsection=0&rvslots=main&titles=${encodeURIComponent(title)}&format=json&formatversion=2`,
    `wt_${slug(title)}`,
  );
  const txt = j?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content;
  if (!txt) return null;
  const m = txt.match(/\{\{Info\/Futebol[\s\S]*?\n\}\}/i);
  return m ? m[0] : null;
}

// Limpa um valor de wikitexto -> texto legível.
function clean(v) {
  let s = String(v ?? "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  s = s.replace(/\{\{\s*converter\s*\|\s*([\d.,]+)\s*\|\s*m[^{}]*\}\}/gi, "$1 m"); // altura
  s = s.replace(/\{\{\s*(?:small|pequeno|nowrap)\s*\|([^{}]*)\}\}/gi, "$1");
  s = s.replace(/\{\{\s*Futebol\s+([^{}|]+?)\s*(?:\|[^{}]*)?\}\}/gi, "$1"); // {{Futebol Liverpool}} -> Liverpool
  s = s.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1");
  s = s.replace(/\{\{[^{}]*\}\}/g, ""); // demais templates
  s = s.replace(/<[^>]+>/g, "").replace(/'''?/g, "").replace(/}}\s*$/, "");
  return s.replace(/\s+/g, " ").trim();
}
const toNum = (v) => {
  const m = clean(v).match(/-?\d[\d.]*/);
  return m ? Number(m[0].replace(/\./g, "")) : null;
};

function fieldMap(box) {
  const map = {};
  for (const chunk of box.split(/\n(?=\s*\|)/)) {
    const m = chunk.match(/^\s*\|\s*([^=]+?)\s*=\s*([\s\S]*)$/);
    if (m) map[m[1].trim()] = m[2].trim();
  }
  return map;
}

function ageFrom(box) {
  let m = box.match(/\{\{\s*dni\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)/i);
  let d, mo, y;
  if (m) [, d, mo, y] = m.map(Number);
  else if ((m = box.match(/\{\{\s*Nascimento e idade\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)/i))) [, y, mo, d] = m.map(Number);
  if (!y) return null;
  let age = TODAY.getFullYear() - y;
  if (TODAY.getMonth() + 1 < mo || (TODAY.getMonth() + 1 === mo && TODAY.getDate() < d)) age--;
  return age;
}

function parseInfobox(box) {
  const f = fieldMap(box);
  const out = {
    age: ageFrom(box),
    height: clean(f["altura"]) || null,
    foot: clean(f["pé"] || f["pe"]) || null,
    number: toNum(f["número"] ?? f["numero"]) ?? null,
    clubs: [],
    nat: null,
  };
  // Carreira em clubes (linhas anoN/clubeN/jogosN/golsN; ignora base-/juvenil).
  for (let n = 1; n <= 40; n++) {
    const club = clean(f[`clube${n}`]);
    if (!f[`ano${n}`] && !club) continue;
    if (!club) continue;
    out.clubs.push({ years: clean(f[`ano${n}`]), club, apps: toNum(f[`jogos${n}`]), goals: toNum(f[`gols${n}`]) });
  }
  out.careerApps = out.clubs.reduce((a, c) => a + (c.apps ?? 0), 0) || null;
  out.careerGoals = out.clubs.reduce((a, c) => a + (c.goals ?? 0), 0) || null;
  // Seleção principal: a entrada NÃO "Sub" mais recente (de preferência a em curso "ano–").
  const sel = [];
  for (let n = 1; n <= 12; n++) {
    const rawName = f[`seleção${n}`] ?? f[`selecao${n}`];
    const rawAno = f[`seleção-ano${n}`] ?? f[`selecao-ano${n}`];
    if (!rawName && !rawAno) continue;
    sel.push({
      n,
      youth: /sub[\s-]?\d|\bsub\b/i.test(rawName ?? ""),
      ongoing: /[–-]\s*$/.test((rawAno ?? "").trim()),
      years: clean(rawAno),
      apps: toNum(f[`seleção-jogos${n}`] ?? f[`selecao-jogos${n}`]),
      goals: toNum(f[`seleção-gols${n}`] ?? f[`selecao-gols${n}`]),
    });
  }
  const senior = sel.filter((s) => !s.youth);
  const pick = senior.filter((s) => s.ongoing).pop() ?? senior.pop();
  if (pick) out.nat = { years: pick.years, apps: pick.apps, goals: pick.goals };
  return out;
}

// ---- LOOP ----------------------------------------------------------------------

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
let done = 0, miss = 0, n = 0;
for (const [code, squad] of Object.entries(data)) {
  if (ONLY && !ONLY.includes(code)) continue;
  for (const p of squad.players) {
    if (p.descSource?.startsWith("wikipedia") && !FORCE) continue; // já resolvido (PT ou EN)
    n++;
    const r = await resolve(p.name, p.club, OVERRIDE[`${code}-${p.number}`]);
    if (!r) {
      miss++;
      console.log(`– ${code} ${p.name}: sem Wikipédia de futebolista`);
      p.wikiDone = true;
      continue;
    }
    const { page, lang } = r;
    p.desc = lang === "en" ? await translate(page.desc) : page.desc;
    p.descSource = lang === "en" ? "wikipedia-en" : "wikipedia";
    p.wikiTitle = page.title;
    if (lang === "pt") {
      const box = await fetchInfobox(page.title); // carreira só da infobox PT
      if (box) {
        const ib = parseInfobox(box);
        if (ib.age != null) p.age = ib.age;
        p.wiki = { height: ib.height, foot: ib.foot, clubs: ib.clubs, careerApps: ib.careerApps, careerGoals: ib.careerGoals, nat: ib.nat };
      }
    }
    p.wikiDone = true;
    done++;
    const nat = p.wiki?.nat ? ` | seleção ${p.wiki.nat.apps ?? "?"}j/${p.wiki.nat.goals ?? "?"}g` : "";
    console.log(`✓ ${code} ${p.name} (${page.title})${lang === "en" ? " [EN→PT]" : ""}${nat}`);
    if (n % 10 === 0) writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
  }
}
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`\n${done} jogadores via Wikipédia · ${miss} sem · leva de ${n}.`);
