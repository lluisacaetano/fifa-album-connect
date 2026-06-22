// Alinha o URUGUAI ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Sergio Rochet", our: "S. Rochet", position: "Goleiro" },
  { no: 3, official: "Nahitan Nández", add: true, position: "Meio" },
  { no: 4, official: "Ronald Araújo", our: "R. Araújo", position: "Defesa" },
  { no: 5, official: "José María Giménez", our: "J. Giménez", position: "Defesa" },
  { no: 6, official: "Mathías Olivera", our: "M. Olivera", position: "Defesa" },
  { no: 7, official: "Manuel Ugarte", our: "M. Ugarte", position: "Meio" },
  { no: 8, official: "Federico Valverde", our: "F. Valverde", position: "Meio" },
  { no: 9, official: "Nicolás de la Cruz", our: "N. de la Cruz", position: "Meio" },
  { no: 10, official: "Facundo Pellistri", our: "F. Pellistri", position: "Ataque" },
  { no: 11, official: "Maximiliano Araújo", our: "M. Araújo", position: "Ataque" },
  { no: 12, official: "Darwin Núñez", our: "D. Núñez", position: "Ataque" },
  { no: 14, official: "Rodrigo Bentancur", our: "R. Bentancur", position: "Meio" },
  { no: 15, official: "Giorgian de Arrascaeta", our: "G. de Arrascaeta", position: "Meio" },
  { no: 16, official: "Brian Rodríguez", our: "B. Rodríguez", position: "Ataque" },
  { no: 17, official: "Agustín Álvarez Martínez", add: true, position: "Ataque" },
  { no: 18, official: "Santiago Bueno", our: "S. Bueno", position: "Defesa" },
  { no: 19, official: "Joaquín Piquerez", our: "J. Piquerez", position: "Defesa" },
  { no: 20, official: "Luciano Rodríguez", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "URU", crest: "/teams/uy/crest.png", photo: "/teams/uy/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const uy = data.uy;
const byName = Object.fromEntries(uy.players.map((p) => [p.name, p]));
let nextId = Math.max(...uy.players.map((p) => p.id)) + 1;

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

uy.players = rebuilt;
uy.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Uruguai: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  URU${p.albumNo}\t${p.name.padEnd(26)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
