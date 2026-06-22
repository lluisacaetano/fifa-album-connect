// Alinha a BÉLGICA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Koen Casteels", add: true, position: "Goleiro" },
  { no: 3, official: "Timothy Castagne", our: "Timothy Castagne", position: "Defesa" },
  { no: 4, official: "Wout Faes", add: true, position: "Defesa" },
  { no: 5, official: "Zeno Debast", our: "Zeno Debast", position: "Defesa" },
  { no: 6, official: "Arthur Theate", our: "Arthur Theate", position: "Defesa" },
  { no: 7, official: "Amadou Onana", our: "A. Onana", position: "Meio" },
  { no: 8, official: "Youri Tielemans", our: "Youri Tielemans", position: "Meio" },
  { no: 9, official: "Kevin De Bruyne", our: "Kevin De Bruyne", position: "Meio" },
  { no: 10, official: "Charles De Ketelaere", our: "Charles De Ketelaere", position: "Meio" },
  { no: 11, official: "Jérémy Doku", our: "Jérémy Doku", position: "Ataque" },
  { no: 12, official: "Romelu Lukaku", our: "Romelu Lukaku", position: "Ataque" },
  { no: 14, official: "Loïs Openda", add: true, position: "Ataque" },
  { no: 15, official: "Johan Bakayoko", add: true, position: "Ataque" },
  { no: 16, official: "Maxim De Cuyper", our: "Maxim De Cuyper", position: "Defesa" },
  { no: 17, official: "Koni De Winter", our: "K. De Winter", position: "Defesa" },
  { no: 18, official: "Alexis Saelemaekers", our: "Alexis Saelemaekers", position: "Meio" },
  { no: 19, official: "Aster Vranckx", add: true, position: "Meio" },
  { no: 20, official: "Malick Fofana", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "BEL", crest: "/teams/be/crest.png", photo: "/teams/be/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const be = data.be;
const byName = Object.fromEntries(be.players.map((p) => [p.name, p]));
let nextId = Math.max(...be.players.map((p) => p.id)) + 1;

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

be.players = rebuilt;
be.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Bélgica: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  BEL${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
