// Alinha o CATAR ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Meshaal Barsham", our: "Meshaal Barsham", position: "Goleiro" },
  { no: 3, official: "Pedro Miguel", our: "Pedro Miguel", position: "Defesa" },
  { no: 4, official: "Tarek Salman", add: true, position: "Defesa" },
  { no: 5, official: "Lucas Mendes", our: "Lucas Mendes", position: "Defesa" },
  { no: 6, official: "Homam Ahmed", our: "Homam Ahmed", position: "Defesa" },
  { no: 7, official: "Ahmed Fathy", our: "Ahmed Fathi", position: "Defesa" },
  { no: 8, official: "Mostafa Mashaal", add: true, position: "Meio" },
  { no: 9, official: "Ahmed Al-Rawi", add: true, position: "Meio" },
  { no: 10, official: "Akram Afif", our: "Akram Afif", position: "Ataque" },
  { no: 11, official: "Ahmed Alaaeldin", our: "Ahmed Alaa", position: "Meio" },
  { no: 12, official: "Almoez Ali", our: "Almoez Ali", position: "Ataque" },
  { no: 14, official: "Mohammed Muntari", our: "Mohammed Muntari", position: "Ataque" },
  { no: 15, official: "Abdulaziz Hatem", our: "Abdulaziz Hatem", position: "Meio" },
  { no: 16, official: "Jassem Gaber", our: "Jassem Gaber", position: "Defesa" },
  { no: 17, official: "Ismaeel Mohammad", add: true, position: "Defesa" },
  { no: 18, official: "Bassam Al-Rawi", add: true, position: "Defesa" },
  { no: 19, official: "Ahmed Suhail", add: true, position: "Ataque" },
  { no: 20, official: "Yusuf Abdurisag", our: "Yusuf Abdurisag", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "QAT", crest: "/teams/qa/crest.png", photo: "/teams/qa/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const qa = data.qa;
const byName = Object.fromEntries(qa.players.map((p) => [p.name, p]));
let nextId = Math.max(...qa.players.map((p) => p.id)) + 1;

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

qa.players = rebuilt;
qa.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Catar: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  QAT${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
