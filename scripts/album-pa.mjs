// Alinha o PANAMÁ ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Orlando Mosquera", our: "O. Mosquera", position: "Goleiro" },
  { no: 3, official: "Michael Murillo", add: true, position: "Defesa" },
  { no: 4, official: "Fidel Escobar", our: "F. Escobar", position: "Defesa" },
  { no: 5, official: "José Córdoba", our: "J. Córdoba", position: "Defesa" },
  { no: 6, official: "Éric Davis", our: "É. Davis", position: "Defesa" },
  { no: 7, official: "Adalberto Carrasquilla", our: "A. Carrasquilla", position: "Meio" },
  { no: 8, official: "Cristian Martínez", our: "C. Martinez", position: "Meio" },
  { no: 9, official: "Aníbal Godoy", our: "A. Godoy", position: "Meio" },
  { no: 10, official: "Yoel Bárcenas", our: "Y. Bárcenas", position: "Ataque" },
  { no: 11, official: "José Luis Rodríguez", our: "J. Rodríguez", position: "Ataque" },
  { no: 12, official: "Ismael Díaz", our: "I. Díaz", position: "Ataque" },
  { no: 14, official: "Eduardo Guerrero", add: true, position: "Ataque" },
  { no: 15, official: "César Blackman", our: "C. Blackman", position: "Defesa" },
  { no: 16, official: "Carlos Harvey", our: "C. Harvey", position: "Meio" },
  { no: 17, official: "Iván Anderson", add: true, position: "Defesa" },
  { no: 18, official: "Edgardo Fariña", our: "E. Fariña", position: "Defesa" },
  { no: 19, official: "Kahiser Lenis", add: true, position: "Ataque" },
  { no: 20, official: "Tomás Rodríguez", our: "T. Rodríguez", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "PAN", crest: "/teams/pa/crest.png", photo: "/teams/pa/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const pa = data.pa;
const byName = Object.fromEntries(pa.players.map((p) => [p.name, p]));
let nextId = Math.max(...pa.players.map((p) => p.id)) + 1;

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

pa.players = rebuilt;
pa.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Panamá: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  PAN${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
