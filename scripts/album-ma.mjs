// Alinha o MARROCOS ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Yassine Bounou", our: "Y. Bounou", position: "Goleiro" },
  { no: 3, official: "Achraf Hakimi", our: "A. Hakimi", position: "Defesa" },
  { no: 4, official: "Nayef Aguerd", add: true, position: "Defesa" },
  { no: 5, official: "Chadi Riad", our: "C. Riad", position: "Defesa" },
  { no: 6, official: "Noussair Mazraoui", our: "N. Mazraoui", position: "Defesa" },
  { no: 7, official: "Sofyan Amrabat", our: "S. Amrabat", position: "Meio" },
  { no: 8, official: "Azzedine Ounahi", our: "A. Ounahi", position: "Meio" },
  { no: 9, official: "Bilal El Khannouss", our: "B. El Khannouss", position: "Meio" },
  { no: 10, official: "Brahim Díaz", our: "Brahim Díaz", position: "Meio" },
  { no: 11, official: "Hakim Ziyech", add: true, position: "Ataque" },
  { no: 12, official: "Youssef En-Nesyri", add: true, position: "Ataque" },
  { no: 14, official: "Ayoub El Kaabi", our: "A. El Kaabi", position: "Ataque" },
  { no: 15, official: "Eliesse Ben Seghir", add: true, position: "Ataque" },
  { no: 16, official: "Ismael Saibari", our: "I. Saibari", position: "Meio" },
  { no: 17, official: "Abde Ezzalzouli", add: true, position: "Ataque" },
  { no: 18, official: "Jawad El Yamiq", add: true, position: "Defesa" },
  { no: 19, official: "Adam Aznou", add: true, position: "Defesa" },
  { no: 20, official: "Amir Richardson", add: true, position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "MAR", crest: "/teams/ma/crest.png", photo: "/teams/ma/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ma = data.ma;
const byName = Object.fromEntries(ma.players.map((p) => [p.name, p]));
let nextId = Math.max(...ma.players.map((p) => p.id)) + 1;

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

ma.players = rebuilt;
ma.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Marrocos: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  MAR${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
