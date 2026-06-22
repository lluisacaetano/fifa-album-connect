// Stopgap de imagens das 47 seleções (menos Brasil, que é manual).
// Baixa a melhor foto de cada jogador para a pasta do projeto:
//   - tem cutout TheSportsDB (transparente)  -> baixa e dá -trim
//   - só tem foto da API (com fundo)          -> baixa e marca p/ rembg
// Gera /tmp/rembg-list.txt (path|path) p/ o rembg_batch remover o fundo depois.
// Resumível (pula photoLocal/photoCustom) + salva progresso.
//
//   node scripts/localize-photos.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const REMBG_LIST = "/tmp/rembg-list.txt";
writeFileSync(REMBG_LIST, "");
const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 800) throw new Error("muito pequeno"); // imagem placeholder/erro
  writeFileSync(dest, buf);
}

let local = 0, toCut = 0, fail = 0, n = 0;
for (const [code, squad] of Object.entries(data)) {
  if (code === "br") continue; // Brasil é manual
  if (ONLY && !ONLY.includes(code)) continue;
  const dir = `public/players/${code}`;
  mkdirSync(dir, { recursive: true });
  for (const p of squad.players) {
    if (p.photoCustom || p.photoLocal) continue; // já tratado
    const src = p.photo;
    if (!src || !/^https?:/.test(src)) continue;
    const needsRembg = !p.photoCutout; // foto da API tem fundo
    const dest = `${dir}/${p.id}.png`;
    n++;
    try {
      await download(src, dest);
      if (needsRembg) {
        appendFileSync(REMBG_LIST, `${process.cwd()}/${dest}|${process.cwd()}/${dest}\n`);
        toCut++;
      } else {
        execFileSync("magick", [dest, "-fuzz", "12%", "-trim", "+repage", dest], { stdio: "ignore" });
      }
      p.photo = `/players/${code}/${p.id}.png`;
      p.photoCutout = true;
      p.photoLocal = true;
      local++;
      if (n % 10 === 0) process.stdout.write(`\r${local} baixadas · ${toCut} p/ rembg · ${fail} falhas (${code})   `);
    } catch (e) { fail++; }
    if (n % 40 === 0) writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
  }
}
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`\n\nDownload: ${local} locais · ${toCut} marcadas p/ rembg (em ${REMBG_LIST}) · ${fail} falhas.`);
console.log("Próximo: rodar rembg_batch nos fundos e depois -trim.");
