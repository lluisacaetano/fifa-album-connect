// Alinha o EQUADOR ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Hernán Galíndez", our: "H. Galíndez", position: "Goleiro" },
  { no: 3, official: "Ángelo Preciado", our: "Ángelo Preciado", position: "Defesa" },
  { no: 4, official: "Piero Hincapié", our: "Piero Hincapié", position: "Defesa" },
  { no: 5, official: "Willian Pacho", our: "W. Pacho", position: "Defesa" },
  { no: 6, official: "Pervis Estupiñán", our: "P. Estupiñán", position: "Defesa" },
  { no: 7, official: "Moisés Caicedo", our: "M. Caicedo", position: "Meio" },
  { no: 8, official: "Alan Franco", our: "A. Franco", position: "Meio" },
  { no: 9, official: "Pedro Vite", our: "P. Vite", position: "Meio" },
  { no: 10, official: "Kendry Páez", our: "K. Páez", position: "Meio" },
  { no: 11, official: "Jeremy Sarmiento", add: true, position: "Ataque" },
  { no: 12, official: "Enner Valencia", our: "E. Valencia", position: "Ataque" },
  { no: 14, official: "John Yeboah", our: "John Yeboah", position: "Ataque" },
  { no: 15, official: "Gonzalo Plata", our: "G. Plata", position: "Ataque" },
  { no: 16, official: "Kevin Rodríguez", our: "K. Rodríguez", position: "Ataque" },
  { no: 17, official: "Joel Ordóñez", our: "J. Ordoñez", position: "Defesa" },
  { no: 18, official: "Félix Torres", our: "F. Torres", position: "Defesa" },
  { no: 19, official: "Nilson Angulo", our: "N. Angulo", position: "Ataque" },
  { no: 20, official: "John Mercado", add: true, position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "ECU", crest: "/teams/ec/crest.png", photo: "/teams/ec/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ec = data.ec;
const byName = Object.fromEntries(ec.players.map((p) => [p.name, p]));
let nextId = Math.max(...ec.players.map((p) => p.id)) + 1;

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

ec.players = rebuilt;
ec.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Equador: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  ECU${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
