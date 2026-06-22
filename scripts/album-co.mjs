// Alinha a COLÔMBIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Camilo Vargas", our: "C. Vargas", position: "Goleiro" },
  { no: 3, official: "Daniel Muñoz", our: "D. Muñoz", position: "Defesa" },
  { no: 4, official: "Davinson Sánchez", our: "D. Sánchez", position: "Defesa" },
  { no: 5, official: "Jhon Lucumí", our: "J. Lucumí", position: "Defesa" },
  { no: 6, official: "Johan Mojica", our: "J. Mojica", position: "Defesa" },
  { no: 7, official: "Jefferson Lerma", our: "J. Lerma", position: "Meio" },
  { no: 8, official: "Richard Ríos", our: "R. Rios", position: "Meio" },
  { no: 9, official: "James Rodríguez", our: "J. Rodríguez", position: "Meio" },
  { no: 10, official: "Jhon Arias", our: "J. Arias", position: "Ataque" },
  { no: 11, official: "Luis Díaz", our: "L. Díaz", position: "Ataque" },
  { no: 12, official: "Jhon Durán", add: true, position: "Ataque" },
  { no: 14, official: "Rafael Santos Borré", add: true, position: "Ataque" },
  { no: 15, official: "Marino Hinestroza", add: true, position: "Ataque" },
  { no: 16, official: "Kevin Castaño", our: "K. Castaño", position: "Meio" },
  { no: 17, official: "Yáser Asprilla", add: true, position: "Meio" },
  { no: 18, official: "Carlos Cuesta", add: true, position: "Defesa" },
  { no: 19, official: "Juan Fernando Quintero", our: "J. Quintero", position: "Meio" },
  { no: 20, official: "Deiver Machado", our: "D. Machado", position: "Defesa" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "COL", crest: "/teams/co/crest.png", photo: "/teams/co/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const co = data.co;
const byName = Object.fromEntries(co.players.map((p) => [p.name, p]));
let nextId = Math.max(...co.players.map((p) => p.id)) + 1;

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

co.players = rebuilt;
co.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Colômbia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  COL${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
