// Alinha a SUÍÇA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Gregor Kobel", our: "Gregor Kobel", position: "Goleiro" },
  { no: 3, official: "Silvan Widmer", our: "Silvan Dominic Widmer", position: "Defesa" },
  { no: 4, official: "Manuel Akanji", our: "M. Akanji", position: "Defesa" },
  { no: 5, official: "Nico Elvedi", our: "Nico Elvedi", position: "Defesa" },
  { no: 6, official: "Ricardo Rodríguez", our: "Ricardo Iván Rodríguez Araya", position: "Defesa" },
  { no: 7, official: "Granit Xhaka", our: "Granit Xhaka", position: "Meio" },
  { no: 8, official: "Remo Freuler", our: "Remo Marco Freuler", position: "Meio" },
  { no: 9, official: "Ardon Jashari", our: "Ardon Jashari", position: "Meio" },
  { no: 10, official: "Dan Ndoye", our: "Dan Assane Ndoye", position: "Ataque" },
  { no: 11, official: "Xherdan Shaqiri", add: true, position: "Ataque" },
  { no: 12, official: "Breel Embolo", our: "Breel Donald Embolo", position: "Ataque" },
  { no: 14, official: "Zeki Amdouni", our: "Mohamed Zeki Amdouni", position: "Ataque" },
  { no: 15, official: "Johan Manzambi", our: "Johan Manzambi", position: "Meio" },
  { no: 16, official: "Fabian Rieder", our: "Fabian Rieder", position: "Meio" },
  { no: 17, official: "Vincent Sierro", add: true, position: "Meio" },
  { no: 18, official: "Aurèle Amenda", our: "Aurèle Florian Amenda", position: "Defesa" },
  { no: 19, official: "Becir Omeragic", add: true, position: "Defesa" },
  { no: 20, official: "Isaac Schmidt", add: true, position: "Defesa" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "SUI", crest: "/teams/ch/crest.png", photo: "/teams/ch/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ch = data.ch;
const byName = Object.fromEntries(ch.players.map((p) => [p.name, p]));
let nextId = Math.max(...ch.players.map((p) => p.id)) + 1;

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

ch.players = rebuilt;
ch.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Suíça: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  SUI${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
