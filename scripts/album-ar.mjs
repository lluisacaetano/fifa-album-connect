// Alinha a ARGENTINA ao álbum oficial Panini 2026 (mesmo padrão das outras).
// Fora do Brasil só ficam os 18 do álbum. Nomes exibidos = nomes oficiais (Panini).
import { readFileSync, writeFileSync } from "node:fs";

// no = nº da figurinha (ARG<n>). our = nome no NOSSO JSON; official = exibição; add = não temos.
const ALBUM = [
  { no: 2, official: "Emiliano Martínez", our: "Emiliano Martinez", position: "Goleiro" },
  { no: 3, official: "Nahuel Molina", our: "N. Molina", position: "Defesa" },
  { no: 4, official: "Cristian Romero", our: "C. Romero", position: "Defesa" },
  { no: 5, official: "Nicolás Otamendi", our: "Nicolás Otamendi", position: "Defesa" },
  { no: 6, official: "Nicolás Tagliafico", our: "Nicolás Tagliafico", position: "Defesa" },
  { no: 7, official: "Enzo Fernández", our: "E. Fernández", position: "Meio" },
  { no: 8, official: "Rodrigo De Paul", our: "R. De Paul", position: "Meio" },
  { no: 9, official: "Alexis Mac Allister", our: "Alexis Mac Allister", position: "Meio" },
  { no: 10, official: "Lionel Messi", our: "Lionel Messi", position: "Ataque" },
  { no: 11, official: "Julián Álvarez", our: "J. Álvarez", position: "Ataque" },
  { no: 12, official: "Lautaro Martínez", our: "Lautaro Martínez", position: "Ataque" },
  { no: 14, official: "Thiago Almada", our: "T. Almada", position: "Meio" },
  { no: 15, official: "Alejandro Garnacho", add: true, position: "Ataque", club: "Chelsea" },
  { no: 16, official: "Nicolás Paz", our: "N. Paz", position: "Meio" },
  { no: 17, official: "Giuliano Simeone", our: "G. Simeone", position: "Ataque" },
  { no: 18, official: "Facundo Medina", our: "F. Medina", position: "Defesa" },
  { no: 19, official: "Leonardo Balerdi", add: true, position: "Defesa", club: "Olympique de Marseille" },
  { no: 20, official: "Exequiel Palacios", our: "E. Palacios", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "ARG", crest: "/teams/ar/crest.png", photo: "/teams/ar/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ar = data.ar;
const byName = Object.fromEntries(ar.players.map((p) => [p.name, p]));
let nextId = Math.max(...ar.players.map((p) => p.id)) + 1;

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

ar.players = rebuilt;
ar.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Argentina: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  ARG${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
