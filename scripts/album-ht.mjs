// Alinha o HAITI ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Johny Placide", our: "J. Placide", position: "Goleiro" },
  { no: 3, official: "Carlens Arcus", our: "C. Arcus", position: "Defesa" },
  { no: 4, official: "Ricardo Adé", our: "Ricardo Ade", position: "Defesa" },
  { no: 5, official: "Jean-Kévin Duverne", our: "J. Duverne", position: "Defesa" },
  { no: 6, official: "Frantzdy Pierrot", our: "Frantzdy Pierrot", position: "Ataque" },
  { no: 7, official: "Leverton Pierre", add: true, position: "Defesa" },
  { no: 8, official: "Danley Jean Jacques", our: "D. Jean-Jacques", position: "Meio" },
  { no: 9, official: "Derrick Étienne Jr.", our: "D. Etienne", position: "Meio" },
  { no: 10, official: "Louicius Don Deedson", our: "Louicius Don Deedson", position: "Meio" },
  { no: 11, official: "Duckens Nazon", our: "D. Nazon", position: "Ataque" },
  { no: 12, official: "Fafà Picault", add: true, position: "Ataque" },
  { no: 14, official: "Mondy Prunier", add: true, position: "Defesa" },
  { no: 15, official: "Ruben Providence", our: "Ruben Providence", position: "Ataque" },
  { no: 16, official: "Christopher Attys", add: true, position: "Meio" },
  { no: 17, official: "Jimmylson Guillaume", add: true, position: "Meio" },
  { no: 18, official: "Garven Metusala", our: "G. Métusala", position: "Defesa" },
  { no: 19, official: "Carl Sainté", our: "C. F. Sainte", position: "Meio" },
  { no: 20, official: "Dany Jean", add: true, position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "HTI", crest: "/teams/ht/crest.png", photo: "/teams/ht/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ht = data.ht;
const byName = Object.fromEntries(ht.players.map((p) => [p.name, p]));
let nextId = Math.max(...ht.players.map((p) => p.id)) + 1;

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

ht.players = rebuilt;
ht.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Haiti: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  HTI${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
