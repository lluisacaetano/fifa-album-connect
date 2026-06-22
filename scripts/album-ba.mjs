// Alinha a BÓSNIA E HERZEGOVINA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Nikola Vasilj", our: "Nikola Vasilj", position: "Goleiro" },
  { no: 3, official: "Amar Dedić", our: "Amar Dedić", position: "Defesa" },
  { no: 4, official: "Adrian Leon Barišić", add: true, position: "Defesa" },
  { no: 5, official: "Dennis Hadžikadunić", our: "Dennis Hadžikadunić", position: "Defesa" },
  { no: 6, official: "Jusuf Gazibegović", add: true, position: "Defesa" },
  { no: 7, official: "Ivan Šunjić", our: "I. Sunjic", position: "Meio" },
  { no: 8, official: "Benjamin Tahirović", our: "B. Tahirovic", position: "Meio" },
  { no: 9, official: "Armin Gigović", our: "A. Gigovic", position: "Meio" },
  { no: 10, official: "Ermedin Demirović", our: "E. Demirovic", position: "Ataque" },
  { no: 11, official: "Haris Hajradinović", add: true, position: "Meio" },
  { no: 12, official: "Edin Džeko", our: "E. Dzeko", position: "Ataque" },
  { no: 14, official: "Esmir Bajraktarević", our: "E. Bajraktarevic", position: "Ataque" },
  { no: 15, official: "Dario Šarić", add: true, position: "Meio" },
  { no: 16, official: "Tarik Muharemović", our: "T. Muharemovic", position: "Defesa" },
  { no: 17, official: "Nail Omerović", add: true, position: "Meio" },
  { no: 18, official: "Ifet Đakovac", add: true, position: "Meio" },
  { no: 19, official: "Nihad Mujakić", our: "N. Mujakic", position: "Defesa" },
  { no: 20, official: "Ivan Bašić", our: "I. Basic", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "BIH", crest: "/teams/ba/crest.png", photo: "/teams/ba/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ba = data.ba;
const byName = Object.fromEntries(ba.players.map((p) => [p.name, p]));
let nextId = Math.max(...ba.players.map((p) => p.id)) + 1;

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

ba.players = rebuilt;
ba.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Bósnia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  BIH${p.albumNo}\t${p.name.padEnd(26)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
