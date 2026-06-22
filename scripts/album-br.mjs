// Alinha o BRASIL às listas OFICIAIS:
//  - Elenco Ancelotti (26, com números) -> flag inSquad + número da camisa  (seção Jogadores)
//  - Álbum Panini (20: escudo BRA1 + foto BRA13 + 18 jogadores) -> inAlbum + albumNo  (seção Figurinhas)
// Corrige 2 erros dos dados da API: #2 é Wesley (não Éderson/Atalanta) e #25 é Igor Thiago (não Thiago Silva).
import { readFileSync, writeFileSync } from "node:fs";

// Elenco oficial (nome no NOSSO JSON -> número da camisa).
const SQUAD = {
  "Alisson Becker": 1, "Wesley": 2, "Gabriel Magalhães": 3, "Marquinhos": 4, "Casemiro": 5,
  "Alex Sandro": 6, "Vinícius Júnior": 7, "Bruno Guimarães": 8, "Matheus Cunha": 9, "Neymar": 10,
  "Raphinha": 11, "Weverton": 12, "Danilo": 13, "Bremer": 14, "Léo Pereira": 15,
  "Douglas Santos": 16, "Fabinho": 17, "Danilo Santos": 18, "Endrick": 19, "Lucas Paquetá": 20,
  "Luiz Henrique": 21, "Gabriel Martinelli": 22, "Ederson": 23, "Ibañez": 24, "Igor Thiago": 25, "Rayan": 26,
};

// Álbum Panini (nome -> número da figurinha BRA<n>). Escudo = BRA1, Foto = BRA13.
const ALBUM = {
  "Alisson Becker": 2, "Bento": 3, "Marquinhos": 4, "Éder Militão": 5, "Gabriel Magalhães": 6,
  "Danilo": 7, "Wesley": 8, "Lucas Paquetá": 9, "Casemiro": 10, "Bruno Guimarães": 11,
  "Luiz Henrique": 12, "Vinícius Júnior": 14, "Rodrygo": 15, "João Pedro": 16, "Matheus Cunha": 17,
  "Gabriel Martinelli": 18, "Raphinha": 19, "Estêvão": 20,
};
const ALBUM_META = { crestNo: 1, photoNo: 13 };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const br = data.br;

// Correção #25: "Thiago" (que a API trouxe como Thiago Silva) é na verdade Igor Thiago (Brentford).
const t25 = br.players.find((p) => p.name === "Thiago");
if (t25) {
  t25.name = "Igor Thiago";
  t25.club = "Brentford";
  // re-enriquecer e DESCARTAR a foto/bio do jogador errado (Thiago Silva).
  for (const k of ["desc", "descSource", "wiki", "wikiTitle", "wikiDone", "photo", "photoApi", "photoCutout", "photoTsdbDone", "photoCustom", "photoScale", "age", "goals", "assists", "apps", "statsSource"]) delete t25[k];
}
// Wesley assume a #2 (no lugar do Éderson/Atalanta, que sai do elenco).
const wesley = br.players.find((p) => p.name === "Wesley");
if (wesley) wesley.number = "2";

// Aplica flags + números.
for (const p of br.players) {
  p.inSquad = Object.hasOwn(SQUAD, p.name);
  if (p.inSquad) p.number = String(SQUAD[p.name]);
  p.inAlbum = Object.hasOwn(ALBUM, p.name);
  p.albumNo = p.inAlbum ? ALBUM[p.name] : null;
}
br.album = ALBUM_META;

const squad = br.players.filter((p) => p.inSquad).sort((a, b) => Number(a.number) - Number(b.number));
const album = br.players.filter((p) => p.inAlbum).sort((a, b) => a.albumNo - b.albumNo);
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Elenco (inSquad): ${squad.length}  ·  Álbum (inAlbum): ${album.length}`);
console.log("Fora de ambos:", br.players.filter((p) => !p.inSquad && !p.inAlbum).map((p) => p.name).join(", ") || "—");
console.log("\nÁlbum (ordem oficial):");
const cells = [...album.map((p) => [p.albumNo, p.name]), [ALBUM_META.crestNo, "🛡️ Escudo CBF"], [ALBUM_META.photoNo, "📸 Foto da Seleção"]].sort((a, b) => a[0] - b[0]);
for (const [no, name] of cells) console.log(`  BRA${no}\t${name}`);
