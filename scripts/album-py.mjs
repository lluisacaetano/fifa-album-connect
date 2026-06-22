// Alinha o PARAGUAI ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Roberto Fernández", our: "R. Fernandez", position: "Goleiro" },
  { no: 3, official: "Juan Cáceres", our: "J. Cáceres", position: "Defesa" },
  { no: 4, official: "Omar Alderete", our: "O. Alderete", position: "Defesa" },
  { no: 5, official: "Gustavo Gómez", our: "G. Gómez", position: "Defesa" },
  { no: 6, official: "Junior Alonso", our: "J. Alonso", position: "Defesa" },
  { no: 7, official: "Andrés Cubas", our: "A. Cubas", position: "Meio" },
  { no: 8, official: "Mathías Villasanti", add: true, position: "Meio" },
  { no: 9, official: "Diego Gómez", our: "D. Gómez", position: "Meio" },
  { no: 10, official: "Miguel Almirón", our: "M. Almirón", position: "Ataque" },
  { no: 11, official: "Julio Enciso", our: "J. Enciso", position: "Ataque" },
  { no: 12, official: "Antonio Sanabria", our: "A. Sanabria", position: "Ataque" },
  { no: 14, official: "Ramón Sosa", our: "R. Sosa", position: "Ataque" },
  { no: 15, official: "Gabriel Ávalos", our: "G. Ávalos", position: "Ataque" },
  { no: 16, official: "Damián Bobadilla", our: "D. Bobadilla", position: "Meio" },
  { no: 17, official: "Matías Galarza", our: "M. Galarza", position: "Meio" },
  { no: 18, official: "Fabián Balbuena", our: "F. Balbuena", position: "Defesa" },
  { no: 19, official: "Agustín Sández", add: true, position: "Defesa" },
  { no: 20, official: "Isidro Pitta", our: "I. Pitta", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "PAR", crest: "/teams/py/crest.png", photo: "/teams/py/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const py = data.py;
const byName = Object.fromEntries(py.players.map((p) => [p.name, p]));
let nextId = Math.max(...py.players.map((p) => p.id)) + 1;

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

py.players = rebuilt;
py.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Paraguai: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  PAR${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
