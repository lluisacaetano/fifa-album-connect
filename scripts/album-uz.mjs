// Alinha o UZBEQUISTÃO ao álbum oficial Panini 2026 (mesmo padrão das outras).
// Obs: o álbum lista Abbosbek Fayzulla(y)ev em UZB8 e UZB16 (duplicata da Panini).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Utkir Yusupov", our: "U. Yusupov", position: "Goleiro" },
  { no: 3, official: "Khusniddin Alikulov", add: true, position: "Defesa" },
  { no: 4, official: "Rustam Ashurmatov", our: "Rustam Ashurmatov", position: "Defesa" },
  { no: 5, official: "Abdukodir Khusanov", our: "Abdukodir Khusanov", position: "Defesa" },
  { no: 6, official: "Farrukh Sayfiev", our: "Farrukh Sayfiev", position: "Defesa" },
  { no: 7, official: "Otabek Shukurov", our: "Otabek Shukurov", position: "Meio" },
  { no: 8, official: "Abbosbek Fayzullayev", our: "Abbosbek Fayzullaev", position: "Meio" },
  { no: 9, official: "Jamshid Iskanderov", our: "Jamshid Iskanderov", position: "Meio" },
  { no: 10, official: "Jaloliddin Masharipov", add: true, position: "Meio" },
  { no: 11, official: "Eldor Shomurodov", our: "E. Shomurodov", position: "Ataque" },
  { no: 12, official: "Igor Sergeev", our: "I. Sergeev", position: "Ataque" },
  { no: 14, official: "Khojiakbar Alijonov", our: "Khojiakbar Alijonov", position: "Defesa" },
  { no: 15, official: "Bobur Abdukholikov", add: true, position: "Ataque" },
  { no: 16, official: "Abbosbek Fayzullaev", add: true, position: "Meio" },
  { no: 17, official: "Umar Eshmuradov", our: "Umar Eshmurodov", position: "Meio" },
  { no: 18, official: "Azizbek Turgunboev", add: true, position: "Ataque" },
  { no: 19, official: "Diyor Kholmatov", add: true, position: "Defesa" },
  { no: 20, official: "Behruz Askarov", add: true, position: "Goleiro" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "UZB", crest: "/teams/uz/crest.png", photo: "/teams/uz/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const uz = data.uz;
const byName = Object.fromEntries(uz.players.map((p) => [p.name, p]));
let nextId = Math.max(...uz.players.map((p) => p.id)) + 1;

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

uz.players = rebuilt;
uz.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Uzbequistão: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  UZB${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
