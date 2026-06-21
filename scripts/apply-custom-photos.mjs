// Aplica fotos MANUAIS (suas) por cima das automáticas, com prioridade.
// Você salva as imagens em:  public/players/custom/<code>/<arquivo>
//   <code>  = código da seleção (br, ar, fr, gb-eng, ...)
//   <arquivo> = número da camisa (ex.: 10.webp) OU nome do jogador (ex.: neymar.webp)
// Aceita .webp / .png / .jpg — converte tudo para .png (via sips, nativo do macOS).
//
//   node scripts/apply-custom-photos.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = "public/players/custom";
const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const slug = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

let applied = 0, skipped = 0;
for (const [code, squad] of Object.entries(data)) {
  const dir = `${ROOT}/${code}`;
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    const m = file.match(/^(.+)\.(webp|png|jpg|jpeg)$/i);
    if (!m) continue;
    const base = m[1];
    const ext = m[2].toLowerCase();
    if (ext === "png" && /^\d+$/.test(base)) {
      // já é o png final de um número — pula só se já aplicado a alguém
    }
    // casa por número da camisa, ou por nome
    const bslug = slug(base);
    const player = /^\d+$/.test(base)
      ? squad.players.find((p) => String(p.number) === base)
      : squad.players.find((p) => {
          const n = slug(p.nameApi || p.name), n2 = slug(p.name);
          return n === bslug || n2 === bslug || n.includes(bslug) || bslug.includes(n);
        });
    if (!player) { console.log(`?  ${code}/${file}: nenhum jogador casou (use número da camisa ou nome)`); skipped++; continue; }

    const outName = `${player.number || player.id}.png`;
    const src = `${dir}/${file}`;
    const out = `${dir}/${outName}`;
    try {
      if (ext === "png" && file === outName) {
        // já está no formato/nome final
      } else {
        execFileSync("sips", ["-s", "format", "png", src, "--out", out], { stdio: "ignore" });
      }
    } catch (e) { console.log(`!  erro convertendo ${file}: ${e.message}`); skipped++; continue; }

    player.photo = `/players/custom/${code}/${outName}`;
    player.photoCutout = true;
    player.photoCustom = true; // protege das rodadas automáticas
    applied++;
    console.log(`✓  ${code}/${file} -> ${player.name} (#${player.number ?? "?"})`);
  }
}
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`\n${applied} foto(s) manual(is) aplicada(s)${skipped ? ` · ${skipped} sem casar` : ""}.`);
