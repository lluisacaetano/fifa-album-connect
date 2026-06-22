// Alinha o CANADÁ ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Maxime Crépeau", our: "Maxime Crépeau", position: "Goleiro" },
  { no: 3, official: "Alistair Johnston", our: "Alistair William Johnston", position: "Defesa" },
  { no: 4, official: "Moïse Bombito", our: "Moïse Bombito Lumpungu", position: "Defesa" },
  { no: 5, official: "Derek Cornelius", our: "Derek Austin Cornelius", position: "Defesa" },
  { no: 6, official: "Alphonso Davies", our: "Alphonso Boyle Davies", position: "Defesa" },
  { no: 7, official: "Ismaël Koné", our: "Ismaël Kenneth Jordan Koné", position: "Meio" },
  { no: 8, official: "Stephen Eustáquio", our: "Stephen Antunes Eustáquio", position: "Meio" },
  { no: 9, official: "Mathieu Choinière", our: "Mathieu Choinière", position: "Meio" },
  { no: 10, official: "Jonathan David", our: "Jonathan Christian David", position: "Ataque" },
  { no: 11, official: "Cyle Larin", our: "Cyle Christopher Larin", position: "Ataque" },
  { no: 12, official: "Tajon Buchanan", our: "Tajon Trevor Buchanan", position: "Ataque" },
  { no: 14, official: "Jacob Shaffelburg", our: "Jacob Everett Shaffelburg", position: "Ataque" },
  { no: 15, official: "Promise David", add: true, position: "Ataque" },
  { no: 16, official: "Ali Ahmed", our: "A. Ahmed", position: "Meio" },
  { no: 17, official: "Richie Laryea", our: "Richmond Mamah Laryea", position: "Defesa" },
  { no: 18, official: "Luc de Fougerolles", our: "Luc Rollet De Fougerolles", position: "Defesa" },
  { no: 19, official: "Niko Sigur", our: "Niko Kristian Sigur", position: "Defesa" },
  { no: 20, official: "Nathan Saliba", our: "Nathan-Dylan Saliba", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "CAN", crest: "/teams/ca/crest.png", photo: "/teams/ca/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ca = data.ca;
const byName = Object.fromEntries(ca.players.map((p) => [p.name, p]));
let nextId = Math.max(...ca.players.map((p) => p.id)) + 1;

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

ca.players = rebuilt;
ca.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Canadá: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  CAN${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
