// Alinha o IRÃ ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Alireza Beiranvand", our: "A. Beiranvand", position: "Goleiro" },
  { no: 3, official: "Sadegh Moharrami", add: true, position: "Defesa" },
  { no: 4, official: "Shoja Khalilzadeh", our: "S. Khalilzadeh", position: "Defesa" },
  { no: 5, official: "Hossein Kanaani", our: "H. Kanani", position: "Defesa" },
  { no: 6, official: "Milad Mohammadi", our: "M. Mohammadi", position: "Defesa" },
  { no: 7, official: "Saeid Ezatolahi", our: "S. Ezatolahi", position: "Meio" },
  { no: 8, official: "Mohammad Karimi", add: true, position: "Meio" },
  { no: 9, official: "Mehdi Ghayedi", our: "M. Ghaedi", position: "Ataque" },
  { no: 10, official: "Mehdi Taremi", our: "M. Taremi", position: "Ataque" },
  { no: 11, official: "Sardar Azmoun", add: true, position: "Ataque" },
  { no: 12, official: "Alireza Jahanbakhsh", our: "A. Jahanbakhsh", position: "Ataque" },
  { no: 14, official: "Mohammad Mohebi", our: "M. Mohebi", position: "Ataque" },
  { no: 15, official: "Ali Gholizadeh", add: true, position: "Ataque" },
  { no: 16, official: "Omid Noorafkan", add: true, position: "Defesa" },
  { no: 17, official: "Saleh Hardani", our: "Saleh Hardani", position: "Defesa" },
  { no: 18, official: "Aria Yousefi", our: "A. Yousefi", position: "Meio" },
  { no: 19, official: "Mohammad Amin Hazbavi", add: true, position: "Meio" },
  { no: 20, official: "Amirhossein Hosseinzadeh", our: "A. Hosseinzadeh", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "IRN", crest: "/teams/ir/crest.png", photo: "/teams/ir/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ir = data.ir;
const byName = Object.fromEntries(ir.players.map((p) => [p.name, p]));
let nextId = Math.max(...ir.players.map((p) => p.id)) + 1;

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

ir.players = rebuilt;
ir.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Irã: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  IRN${p.albumNo}\t${p.name.padEnd(26)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
