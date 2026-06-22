// Alinha a NORUEGA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Ørjan Håskjold Nyland", our: "Ø. Nyland", position: "Goleiro" },
  { no: 3, official: "Julian Ryerson", our: "J. Ryerson", position: "Defesa" },
  { no: 4, official: "Kristoffer Ajer", our: "K. Ajer", position: "Defesa" },
  { no: 5, official: "Leo Østigård", our: "L. Østigård", position: "Defesa" },
  { no: 6, official: "David Møller Wolfe", our: "D. Møller Wolfe", position: "Defesa" },
  { no: 7, official: "Martin Ødegaard", our: "M. Ødegaard", position: "Meio" },
  { no: 8, official: "Sander Berge", our: "S. Berge", position: "Meio" },
  { no: 9, official: "Patrick Berg", our: "P. Berg", position: "Meio" },
  { no: 10, official: "Antonio Nusa", our: "A. Nusa", position: "Ataque" },
  { no: 11, official: "Oscar Bobb", our: "Oscar Bobb", position: "Ataque" },
  { no: 12, official: "Erling Haaland", our: "E. Haaland", position: "Ataque" },
  { no: 14, official: "Alexander Sørloth", our: "A. Sørloth", position: "Ataque" },
  { no: 15, official: "Andreas Schjelderup", our: "A. Schjelderup", position: "Ataque" },
  { no: 16, official: "Thelo Aasgaard", our: "T. Aasgaard", position: "Meio" },
  { no: 17, official: "Andreas Hanche-Olsen", add: true, position: "Defesa" },
  { no: 18, official: "Stian Gregersen", add: true, position: "Defesa" },
  { no: 19, official: "Aron Dønnum", add: true, position: "Ataque" },
  { no: 20, official: "Jens Petter Hauge", our: "J. Hauge", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "NOR", crest: "/teams/no/crest.png", photo: "/teams/no/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const no = data.no;
const byName = Object.fromEntries(no.players.map((p) => [p.name, p]));
let nextId = Math.max(...no.players.map((p) => p.id)) + 1;

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

no.players = rebuilt;
no.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Noruega: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  NOR${p.albumNo}\t${p.name.padEnd(26)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
