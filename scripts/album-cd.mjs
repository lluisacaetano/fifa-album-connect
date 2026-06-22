// Alinha a REPÚBLICA DEMOCRÁTICA DO CONGO ao álbum oficial Panini 2026.
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Dimitry Bertaud", add: true, position: "Goleiro" },
  { no: 3, official: "Gédéon Kalulu", our: "G. Kalulu", position: "Defesa" },
  { no: 4, official: "Chancel Mbemba", our: "C. Mbemba", position: "Defesa" },
  { no: 5, official: "Rocky Bushiri", add: true, position: "Defesa" },
  { no: 6, official: "Arthur Masuaku", our: "A. Masuaku", position: "Defesa" },
  { no: 7, official: "Samuel Moutoussamy", our: "S. Moutoussamy", position: "Meio" },
  { no: 8, official: "Edo Kayembe", our: "E. Kayembe", position: "Meio" },
  { no: 9, official: "Grady Diangana", add: true, position: "Ataque" },
  { no: 10, official: "Yoane Wissa", our: "Y. Wissa", position: "Ataque" },
  { no: 11, official: "Théo Bongonda", our: "Theo Bongonda", position: "Ataque" },
  { no: 12, official: "Cédric Bakambu", our: "Cédric Bakambu", position: "Ataque" },
  { no: 14, official: "Simon Banza", our: "Simon Banza", position: "Ataque" },
  { no: 15, official: "Meschack Elia", our: "M. Elia", position: "Ataque" },
  { no: 16, official: "Noah Sadiki", our: "N. Sadiki", position: "Meio" },
  { no: 17, official: "Axel Tuanzebe", our: "A. Tuanzebe", position: "Defesa" },
  { no: 18, official: "Joris Kayembe", our: "J. Kayembe", position: "Defesa" },
  { no: 19, official: "Charles Pickel", our: "C. Pickel", position: "Meio" },
  { no: 20, official: "Ngal'ayel Mukau", our: "N. Mukau", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "COD", crest: "/teams/cd/crest.png", photo: "/teams/cd/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const cd = data.cd;
const byName = Object.fromEntries(cd.players.map((p) => [p.name, p]));
let nextId = Math.max(...cd.players.map((p) => p.id)) + 1;

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

cd.players = rebuilt;
cd.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Rep. Dem. Congo: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  COD${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
