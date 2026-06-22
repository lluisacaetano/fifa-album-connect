// Alinha os PAÍSES BAIXOS ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Bart Verbruggen", our: "B. Verbruggen", position: "Goleiro" },
  { no: 3, official: "Denzel Dumfries", our: "D. Dumfries", position: "Defesa" },
  { no: 4, official: "Virgil van Dijk", our: "V. van Dijk", position: "Defesa" },
  { no: 5, official: "Jurrien Timber", add: true, position: "Defesa" },
  { no: 6, official: "Ian Maatsen", add: true, position: "Defesa" },
  { no: 7, official: "Frenkie de Jong", our: "F. de Jong", position: "Meio" },
  { no: 8, official: "Tijjani Reijnders", our: "T. Reijnders", position: "Meio" },
  { no: 9, official: "Xavi Simons", add: true, position: "Meio" },
  { no: 10, official: "Cody Gakpo", our: "C. Gakpo", position: "Ataque" },
  { no: 11, official: "Noa Lang", our: "N. Lang", position: "Ataque" },
  { no: 12, official: "Brian Brobbey", our: "B. Brobbey", position: "Ataque" },
  { no: 14, official: "Memphis Depay", our: "M. Depay", position: "Ataque" },
  { no: 15, official: "Justin Kluivert", our: "J. Kluivert", position: "Ataque" },
  { no: 16, official: "Jeremie Frimpong", add: true, position: "Defesa" },
  { no: 17, official: "Ryan Gravenberch", our: "R. Gravenberch", position: "Meio" },
  { no: 18, official: "Micky van de Ven", our: "M. van de Ven", position: "Defesa" },
  { no: 19, official: "Jorrel Hato", our: "J. Hato", position: "Defesa" },
  { no: 20, official: "Dean Huijsen", add: true, position: "Defesa" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "NED", crest: "/teams/nl/crest.png", photo: "/teams/nl/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const nl = data.nl;
const byName = Object.fromEntries(nl.players.map((p) => [p.name, p]));
let nextId = Math.max(...nl.players.map((p) => p.id)) + 1;

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

nl.players = rebuilt;
nl.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Países Baixos: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  NED${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
