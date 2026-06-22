// Alinha a ESCÓCIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Angus Gunn", our: "A. Gunn", position: "Goleiro" },
  { no: 3, official: "Anthony Ralston", our: "Anthony Ralston", position: "Defesa" },
  { no: 4, official: "John Souttar", our: "J. Souttar", position: "Defesa" },
  { no: 5, official: "Scott McKenna", our: "Scott McKenna", position: "Defesa" },
  { no: 6, official: "Andy Robertson", our: "A. Robertson", position: "Defesa" },
  { no: 7, official: "Billy Gilmour", add: true, position: "Meio" },
  { no: 8, official: "Scott McTominay", our: "Scott McTominay", position: "Meio" },
  { no: 9, official: "John McGinn", our: "J.  McGinn", position: "Meio" },
  { no: 10, official: "Ryan Christie", our: "R. Christie", position: "Meio" },
  { no: 11, official: "Ben Doak", our: "B. Doak", position: "Ataque" },
  { no: 12, official: "Lyndon Dykes", our: "L. Dykes", position: "Ataque" },
  { no: 14, official: "Che Adams", our: "C. Adams", position: "Ataque" },
  { no: 15, official: "Lewis Ferguson", our: "Lewis Ferguson", position: "Meio" },
  { no: 16, official: "Tommy Conway", add: true, position: "Ataque" },
  { no: 17, official: "Max Johnston", add: true, position: "Defesa" },
  { no: 18, official: "Grant Hanley", our: "Grant Hanley", position: "Defesa" },
  { no: 19, official: "Kieran Tierney", our: "Kieran Tierney", position: "Defesa" },
  { no: 20, official: "Lennon Miller", add: true, position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "SCO", crest: "/teams/gb-sct/crest.png", photo: "/teams/gb-sct/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const sc = data["gb-sct"];
const byName = Object.fromEntries(sc.players.map((p) => [p.name, p]));
let nextId = Math.max(...sc.players.map((p) => p.id)) + 1;

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

sc.players = rebuilt;
sc.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Escócia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  SCO${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
