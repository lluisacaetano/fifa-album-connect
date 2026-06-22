// Alinha o MÉXICO ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Luis Ángel Malagón", add: true, position: "Goleiro" },
  { no: 3, official: "Jorge Sánchez", our: "J. Sánchez", position: "Defesa" },
  { no: 4, official: "César Montes", our: "C. Montes", position: "Defesa" },
  { no: 5, official: "Johan Vásquez", our: "J. Vásquez", position: "Defesa" },
  { no: 6, official: "Jesús Gallardo", our: "J. Gallardo", position: "Defesa" },
  { no: 7, official: "Edson Álvarez", our: "E. Álvarez", position: "Meio" },
  { no: 8, official: "Luis Chávez", our: "L. Chávez", position: "Meio" },
  { no: 9, official: "Orbelín Pineda", our: "Orbelín Pineda Alvarado", position: "Meio" },
  { no: 10, official: "Alexis Vega", our: "A. Vega", position: "Ataque" },
  { no: 11, official: "Hirving Lozano", add: true, position: "Ataque" },
  { no: 12, official: "Santiago Giménez", our: "S. Giménez", position: "Ataque" },
  { no: 14, official: "Raúl Jiménez", our: "R. Jiménez", position: "Ataque" },
  { no: 15, official: "Julián Quiñones", our: "J. Quiñones", position: "Ataque" },
  { no: 16, official: "Marcel Ruiz", add: true, position: "Meio" },
  { no: 17, official: "Erik Lira", our: "É. Lira", position: "Meio" },
  { no: 18, official: "Israel Reyes", our: "I. Reyes", position: "Defesa" },
  { no: 19, official: "Mateo Chávez", our: "M. Chávez", position: "Defesa" },
  { no: 20, official: "Gilberto Mora", our: "Gilberto Rafael Mora Zambrano", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "MEX", crest: "/teams/mx/crest.png", photo: "/teams/mx/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const mx = data.mx;
const byName = Object.fromEntries(mx.players.map((p) => [p.name, p]));
let nextId = Math.max(...mx.players.map((p) => p.id)) + 1;

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

mx.players = rebuilt;
mx.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`México: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  MEX${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
