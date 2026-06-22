// Alinha CURAÇAO ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Eloy Room", our: "E. Room", position: "Goleiro" },
  { no: 3, official: "Sherel Floranus", our: "S. Floranus", position: "Defesa" },
  { no: 4, official: "Cuco Martina", add: true, position: "Defesa" },
  { no: 5, official: "Jurien Gaari", our: "J. Gaari", position: "Defesa" },
  { no: 6, official: "Roshon van Eijma", our: "R. van Eijma", position: "Defesa" },
  { no: 7, official: "Juninho Bacuna", our: "J. Bacuna", position: "Meio" },
  { no: 8, official: "Kenji Gorré", our: "K. Gorré", position: "Meio" },
  { no: 9, official: "Leandro Bacuna", our: "L. Bacuna", position: "Meio" },
  { no: 10, official: "Gervane Kastaneer", our: "G. Kastaneer", position: "Ataque" },
  { no: 11, official: "Jearl Margaritha", our: "J. Margaritha", position: "Ataque" },
  { no: 12, official: "Rangelo Janga", add: true, position: "Ataque" },
  { no: 14, official: "Livano Comenencia", our: "L. Comenencia", position: "Meio" },
  { no: 15, official: "Joshua Brenet", our: "J. Brenet", position: "Defesa" },
  { no: 16, official: "Jeremy Antonisse", our: "J. Antonisse", position: "Meio" },
  { no: 17, official: "Richonell Margaret", add: true, position: "Defesa" },
  { no: 18, official: "Tyrique Mercera", add: true, position: "Defesa" },
  { no: 19, official: "Djevencio van der Kust", add: true, position: "Meio" },
  { no: 20, official: "Godfried Roemeratoe", our: "G. Roemeratoe", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "CUW", crest: "/teams/cw/crest.png", photo: "/teams/cw/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const cw = data.cw;
const byName = Object.fromEntries(cw.players.map((p) => [p.name, p]));
let nextId = Math.max(...cw.players.map((p) => p.id)) + 1;

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

cw.players = rebuilt;
cw.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Curaçao: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  CUW${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
