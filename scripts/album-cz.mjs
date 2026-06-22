// Alinha a REPÚBLICA TCHECA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Matěj Kovář", our: "Matěj Kovář", position: "Goleiro" },
  { no: 3, official: "Vladimír Coufal", our: "Vladimír Coufal", position: "Defesa" },
  { no: 4, official: "Tomáš Holeš", our: "Tomáš Holeš", position: "Defesa" },
  { no: 5, official: "Ladislav Krejčí", our: "Ladislav Krejčí", position: "Defesa" },
  { no: 6, official: "David Jurásek", our: "David Jurásek", position: "Defesa" },
  { no: 7, official: "Tomáš Souček", our: "Tomáš Souček", position: "Meio" },
  { no: 8, official: "Lukáš Červ", our: "Lukáš Červ", position: "Meio" },
  { no: 9, official: "Pavel Šulc", our: "Pavel Šulc", position: "Meio" },
  { no: 10, official: "Václav Černý", add: true, position: "Ataque" },
  { no: 11, official: "Adam Hložek", our: "Adam Hložek", position: "Ataque" },
  { no: 12, official: "Patrik Schick", our: "Patrik Schick", position: "Ataque" },
  { no: 14, official: "Jan Kliment", add: true, position: "Ataque" },
  { no: 15, official: "Matěj Šín", add: true, position: "Meio" },
  { no: 16, official: "Alex Král", add: true, position: "Meio" },
  { no: 17, official: "Martin Vitík", add: true, position: "Defesa" },
  { no: 18, official: "David Zima", our: "David Zima", position: "Defesa" },
  { no: 19, official: "Matěj Ryneš", add: true, position: "Defesa" },
  { no: 20, official: "Lukáš Provod", our: "Lukáš Provod", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "CZE", crest: "/teams/cz/crest.png", photo: "/teams/cz/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const cz = data.cz;
const byName = Object.fromEntries(cz.players.map((p) => [p.name, p]));
let nextId = Math.max(...cz.players.map((p) => p.id)) + 1;

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

cz.players = rebuilt;
cz.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`República Tcheca: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  CZE${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
