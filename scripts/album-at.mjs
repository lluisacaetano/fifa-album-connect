// Alinha a ÁUSTRIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
// Fora do Brasil só ficam os 18 do álbum. Nomes exibidos = nomes oficiais (Panini).
import { readFileSync, writeFileSync } from "node:fs";

// no = nº da figurinha (AUT<n>). our = nome no NOSSO JSON; official = exibição; add = não temos.
const ALBUM = [
  { no: 2, official: "Alexander Schlager", our: "A. Schlager", position: "Goleiro" },
  { no: 3, official: "Stefan Posch", our: "Stefan Posch", position: "Defesa" },
  { no: 4, official: "Kevin Danso", our: "Kevin Danso", position: "Defesa" },
  { no: 5, official: "Philipp Lienhart", our: "Philipp Lienhart", position: "Defesa" },
  { no: 6, official: "Maximilian Wöber", add: true, position: "Defesa" },
  { no: 7, official: "Konrad Laimer", our: "Konrad Laimer", position: "Meio" },
  { no: 8, official: "Nicolas Seiwald", our: "N. Seiwald", position: "Meio" },
  { no: 9, official: "Christoph Baumgartner", add: true, position: "Meio" },
  { no: 10, official: "Marcel Sabitzer", our: "Marcel Sabitzer", position: "Meio" },
  { no: 11, official: "Romano Schmid", our: "R. Schmid", position: "Meio" },
  { no: 12, official: "Michael Gregoritsch", our: "M. Gregoritsch", position: "Ataque" },
  { no: 14, official: "Marko Arnautović", our: "M. Arnautovic", position: "Ataque" },
  { no: 15, official: "Patrick Wimmer", our: "P. Wimmer", position: "Ataque" },
  { no: 16, official: "Nicolas Kühn", add: true, position: "Ataque" },
  { no: 17, official: "Gernot Trauner", add: true, position: "Defesa" },
  { no: 18, official: "David Alaba", our: "David Alaba", position: "Defesa" },
  { no: 19, official: "Alexander Prass", our: "A. Prass", position: "Meio" },
  { no: 20, official: "Leopold Querfeld", add: true, position: "Defesa" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "AUT", crest: "/teams/at/crest.png", photo: "/teams/at/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const at = data.at;
const byName = Object.fromEntries(at.players.map((p) => [p.name, p]));
let nextId = Math.max(...at.players.map((p) => p.id)) + 1;

const rebuilt = ALBUM.map((e) => {
  let p;
  if (e.add) {
    p = { id: nextId++, name: e.official, position: e.position, number: null, age: null, photo: null, club: e.club ?? null };
  } else {
    p = byName[e.our];
    if (!p) throw new Error(`não achei "${e.our}" nos dados`);
    p.name = e.official;
    if (e.position) p.position = e.position;
  }
  p.inSquad = true;
  p.inAlbum = true;
  p.albumNo = e.no;
  return p;
});

at.players = rebuilt;
at.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Áustria: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  AUT${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
