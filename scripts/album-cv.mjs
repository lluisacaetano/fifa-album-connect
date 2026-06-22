// Alinha CABO VERDE ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Vozinha", our: "Vózinha", position: "Goleiro" },
  { no: 3, official: "Steven Moreira", our: "Steven Moreira", position: "Defesa" },
  { no: 4, official: "Logan Costa", our: "Logan Costa", position: "Defesa" },
  { no: 5, official: "Roberto Lopes", our: "Pico", position: "Defesa" },
  { no: 6, official: "Joël Monteiro", add: true, position: "Ataque" },
  { no: 7, official: "Jamiro Monteiro", our: "Jamiro Monteiro", position: "Meio" },
  { no: 8, official: "Deroy Duarte", our: "Deroy Duarte", position: "Meio" },
  { no: 9, official: "Kevin Pina", our: "Kevin Pina", position: "Meio" },
  { no: 10, official: "Kenny Rocha Santos", add: true, position: "Meio" },
  { no: 11, official: "Ryan Mendes", our: "Ryan Mendes", position: "Ataque" },
  { no: 12, official: "Bebé", add: true, position: "Ataque" },
  { no: 14, official: "Jovane Cabral", our: "Jovane Cabral", position: "Ataque" },
  { no: 15, official: "Gilson Tavares", add: true, position: "Meio" },
  { no: 16, official: "Dailon Livramento", our: "D. Livramento", position: "Ataque" },
  { no: 17, official: "Yannick Semedo", our: "Yannick Semedo", position: "Meio" },
  { no: 18, official: "Dylan Tavares", add: true, position: "Defesa" },
  { no: 19, official: "Patrick Andrade", add: true, position: "Meio" },
  { no: 20, official: "Willy Semedo", our: "Willy Semedo", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "CPV", crest: "/teams/cv/crest.png", photo: "/teams/cv/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const cv = data.cv;
const byName = Object.fromEntries(cv.players.map((p) => [p.name, p]));
let nextId = Math.max(...cv.players.map((p) => p.id)) + 1;

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

cv.players = rebuilt;
cv.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Cabo Verde: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  CPV${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
