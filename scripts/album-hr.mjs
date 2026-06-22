// Alinha a CROÁCIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Dominik Livaković", our: "D. Livakovic", position: "Goleiro" },
  { no: 3, official: "Josip Stanišić", our: "J. Stanisic", position: "Defesa" },
  { no: 4, official: "Joško Gvardiol", our: "J. Gvardiol", position: "Defesa" },
  { no: 5, official: "Duje Ćaleta-Car", our: "D. Caleta-Car", position: "Defesa" },
  { no: 6, official: "Borna Sosa", add: true, position: "Defesa" },
  { no: 7, official: "Luka Modrić", our: "L. Modric", position: "Meio" },
  { no: 8, official: "Mateo Kovačić", our: "M. Kovacic", position: "Meio" },
  { no: 9, official: "Lovro Majer", add: true, position: "Meio" },
  { no: 10, official: "Luka Sučić", our: "L. Sucic", position: "Meio" },
  { no: 11, official: "Andrej Kramarić", our: "Andrej Kramarić", position: "Ataque" },
  { no: 12, official: "Ante Budimir", our: "Ante Budimir", position: "Ataque" },
  { no: 14, official: "Ivan Perišić", our: "Ivan Perišić", position: "Ataque" },
  { no: 15, official: "Martin Baturina", our: "M. Baturina", position: "Meio" },
  { no: 16, official: "Petar Sučić", our: "P. Sucic", position: "Meio" },
  { no: 17, official: "Marin Pongračić", our: "M. Pongracic", position: "Defesa" },
  { no: 18, official: "Josip Šutalo", our: "J. Sutalo", position: "Defesa" },
  { no: 19, official: "Igor Matanović", our: "Igor Matanović", position: "Ataque" },
  { no: 20, official: "Mario Pašalić", our: "Mario Pasalic", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "CRO", crest: "/teams/hr/crest.png", photo: "/teams/hr/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const hr = data.hr;
const byName = Object.fromEntries(hr.players.map((p) => [p.name, p]));
let nextId = Math.max(...hr.players.map((p) => p.id)) + 1;

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

hr.players = rebuilt;
hr.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Croácia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  CRO${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
