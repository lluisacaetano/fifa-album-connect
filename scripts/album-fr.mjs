// Alinha a FRANÇA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Mike Maignan", our: "M. Maignan", position: "Goleiro" },
  { no: 3, official: "Jules Koundé", our: "J. Koundé", position: "Defesa" },
  { no: 4, official: "William Saliba", our: "W. Saliba", position: "Defesa" },
  { no: 5, official: "Ibrahima Konaté", our: "I. Konaté", position: "Defesa" },
  { no: 6, official: "Theo Hernández", our: "T. Hernández", position: "Defesa" },
  { no: 7, official: "Aurélien Tchouaméni", our: "Aurélien Tchouaméni", position: "Meio" },
  { no: 8, official: "Eduardo Camavinga", add: true, position: "Meio" },
  { no: 9, official: "Adrien Rabiot", our: "Adrien Rabiot", position: "Meio" },
  { no: 10, official: "Ousmane Dembélé", our: "O. Dembélé", position: "Ataque" },
  { no: 11, official: "Kylian Mbappé", our: "Kylian Mbappé", position: "Ataque" },
  { no: 12, official: "Randal Kolo Muani", add: true, position: "Ataque" },
  { no: 14, official: "Michael Olise", our: "Michael Olise", position: "Ataque" },
  { no: 15, official: "Désiré Doué", our: "D. Doué", position: "Meio" },
  { no: 16, official: "Bradley Barcola", our: "Bradley Barcola", position: "Ataque" },
  { no: 17, official: "Warren Zaïre-Emery", our: "Warren Zaïre-Emery", position: "Meio" },
  { no: 18, official: "Dayot Upamecano", our: "D. Upamecano", position: "Defesa" },
  { no: 19, official: "Malo Gusto", our: "M. Gusto", position: "Defesa" },
  { no: 20, official: "Hugo Ekitiké", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "FRA", crest: "/teams/fr/crest.png", photo: "/teams/fr/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const fr = data.fr;
const byName = Object.fromEntries(fr.players.map((p) => [p.name, p]));
let nextId = Math.max(...fr.players.map((p) => p.id)) + 1;

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

fr.players = rebuilt;
fr.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`França: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  FRA${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
