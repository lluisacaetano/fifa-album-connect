// Alinha a INGLATERRA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Jordan Pickford", our: "J. Pickford", position: "Goleiro" },
  { no: 3, official: "Kyle Walker", add: true, position: "Defesa" },
  { no: 4, official: "John Stones", our: "J. Stones", position: "Defesa" },
  { no: 5, official: "Marc Guéhi", our: "M. Guéhi", position: "Defesa" },
  { no: 6, official: "Lewis Hall", add: true, position: "Defesa" },
  { no: 7, official: "Declan Rice", our: "D. Rice", position: "Meio" },
  { no: 8, official: "Jude Bellingham", our: "J. Bellingham", position: "Meio" },
  { no: 9, official: "Cole Palmer", add: true, position: "Meio" },
  { no: 10, official: "Bukayo Saka", our: "B. Saka", position: "Ataque" },
  { no: 11, official: "Phil Foden", add: true, position: "Meio" },
  { no: 12, official: "Harry Kane", our: "H. Kane", position: "Ataque" },
  { no: 14, official: "Anthony Gordon", our: "A. Gordon", position: "Ataque" },
  { no: 15, official: "Morgan Rogers", our: "M. Rogers", position: "Meio" },
  { no: 16, official: "Eberechi Eze", our: "E. Eze", position: "Meio" },
  { no: 17, official: "Trent Alexander-Arnold", add: true, position: "Defesa" },
  { no: 18, official: "Levi Colwill", add: true, position: "Defesa" },
  { no: 19, official: "Myles Lewis-Skelly", add: true, position: "Defesa" },
  { no: 20, official: "Ethan Nwaneri", add: true, position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "ENG", crest: "/teams/gb-eng/crest.png", photo: "/teams/gb-eng/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const en = data["gb-eng"];
const byName = Object.fromEntries(en.players.map((p) => [p.name, p]));
let nextId = Math.max(...en.players.map((p) => p.id)) + 1;

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

en.players = rebuilt;
en.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Inglaterra: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  ENG${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
