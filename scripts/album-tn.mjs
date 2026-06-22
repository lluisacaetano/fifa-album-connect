// Alinha a TUNÍSIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Bechir Ben Saïd", add: true, position: "Goleiro" },
  { no: 3, official: "Wajdi Kechrida", add: true, position: "Defesa" },
  { no: 4, official: "Yassine Meriah", add: true, position: "Defesa" },
  { no: 5, official: "Montassar Talbi", our: "Montassar Talbi", position: "Defesa" },
  { no: 6, official: "Ali Abdi", our: "A. Abdi", position: "Defesa" },
  { no: 7, official: "Aïssa Laïdouni", add: true, position: "Meio" },
  { no: 8, official: "Ellyes Skhiri", our: "Ellyes Skhiri", position: "Meio" },
  { no: 9, official: "Hannibal Mejbri", our: "Hannibal Mejbri", position: "Meio" },
  { no: 10, official: "Elias Achouri", our: "Elias Achouri", position: "Ataque" },
  { no: 11, official: "Anis Ben Slimane", our: "Anis Ben Slimane", position: "Meio" },
  { no: 12, official: "Seifeddine Jaziri", add: true, position: "Ataque" },
  { no: 14, official: "Sayfallah Ltaief", add: true, position: "Meio" },
  { no: 15, official: "Hazem Mastouri", our: "Hazem Mastouri", position: "Ataque" },
  { no: 16, official: "Mohamed Ali Ben Romdhane", add: true, position: "Meio" },
  { no: 17, official: "Hamza Rafia", add: true, position: "Meio" },
  { no: 18, official: "Dylan Bronn", our: "D. Bronn", position: "Defesa" },
  { no: 19, official: "Nader Ghandri", add: true, position: "Defesa" },
  { no: 20, official: "Yan Valery", our: "Yan Valery", position: "Defesa" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "TUN", crest: "/teams/tn/crest.png", photo: "/teams/tn/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const tn = data.tn;
const byName = Object.fromEntries(tn.players.map((p) => [p.name, p]));
let nextId = Math.max(...tn.players.map((p) => p.id)) + 1;

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

tn.players = rebuilt;
tn.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Tunísia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  TUN${p.albumNo}\t${p.name.padEnd(26)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
