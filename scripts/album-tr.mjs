// Alinha a TURQUIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Mert Günok", our: "Mert Günok", position: "Goleiro" },
  { no: 3, official: "Zeki Çelik", our: "Zeki Çelik", position: "Defesa" },
  { no: 4, official: "Merih Demiral", our: "Merih Demiral", position: "Defesa" },
  { no: 5, official: "Abdülkerim Bardakcı", our: "A. Bardakci", position: "Defesa" },
  { no: 6, official: "Ferdi Kadıoğlu", our: "F. Kadioglu", position: "Defesa" },
  { no: 7, official: "Hakan Çalhanoğlu", our: "Hakan Çalhanoğlu", position: "Meio" },
  { no: 8, official: "Orkun Kökçü", our: "Orkun Kökçü", position: "Meio" },
  { no: 9, official: "Arda Güler", our: "Arda Güler", position: "Meio" },
  { no: 10, official: "Kenan Yıldız", our: "K. Yildiz", position: "Ataque" },
  { no: 11, official: "Kerem Aktürkoğlu", our: "Kerem Aktürkoğlu", position: "Ataque" },
  { no: 12, official: "Barış Alper Yılmaz", add: true, position: "Ataque" },
  { no: 14, official: "İrfan Can Kahveci", our: "İrfan Can Kahveci", position: "Meio" },
  { no: 15, official: "Can Uzun", our: "C. Uzun", position: "Ataque" },
  { no: 16, official: "Kaan Ayhan", our: "Kaan Ayhan", position: "Defesa" },
  { no: 17, official: "Salih Özcan", our: "S. Özcan", position: "Meio" },
  { no: 18, official: "Oğuz Aydın", our: "O. Aydin", position: "Ataque" },
  { no: 19, official: "Semih Kılıçsoy", add: true, position: "Ataque" },
  { no: 20, official: "Yusuf Akçiçek", add: true, position: "Defesa" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "TUR", crest: "/teams/tr/crest.png", photo: "/teams/tr/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const tr = data.tr;
const byName = Object.fromEntries(tr.players.map((p) => [p.name, p]));
let nextId = Math.max(...tr.players.map((p) => p.id)) + 1;

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

tr.players = rebuilt;
tr.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Turquia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  TUR${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
