// Alinha os ESTADOS UNIDOS ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Matt Turner", our: "M. Turner", position: "Goleiro" },
  { no: 3, official: "Sergiño Dest", our: "S. Dest", position: "Defesa" },
  { no: 4, official: "Chris Richards", our: "C. Richards", position: "Defesa" },
  { no: 5, official: "Antonee Robinson", our: "A. Robinson", position: "Defesa" },
  { no: 6, official: "Tyler Adams", our: "T. Adams", position: "Meio" },
  { no: 7, official: "Weston McKennie", our: "W. McKennie", position: "Meio" },
  { no: 8, official: "Yunus Musah", add: true, position: "Meio" },
  { no: 9, official: "Gio Reyna", our: "G. Reyna", position: "Meio" },
  { no: 10, official: "Christian Pulisic", our: "C. Pulisic", position: "Ataque" },
  { no: 11, official: "Timothy Weah", our: "T. Weah", position: "Ataque" },
  { no: 12, official: "Folarin Balogun", our: "F. Balogun", position: "Ataque" },
  { no: 14, official: "Ricardo Pepi", our: "R. Pepi", position: "Ataque" },
  { no: 15, official: "Malik Tillman", our: "M. Tillman", position: "Meio" },
  { no: 16, official: "Johnny Cardoso", add: true, position: "Meio" },
  { no: 17, official: "Tanner Tessmann", add: true, position: "Meio" },
  { no: 18, official: "Auston Trusty", our: "A. Trusty", position: "Defesa" },
  { no: 19, official: "Joe Scally", our: "J. Scally", position: "Defesa" },
  { no: 20, official: "Patrick Agyemang", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "USA", crest: "/teams/us/crest.png", photo: "/teams/us/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const us = data.us;
const byName = Object.fromEntries(us.players.map((p) => [p.name, p]));
let nextId = Math.max(...us.players.map((p) => p.id)) + 1;

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

us.players = rebuilt;
us.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Estados Unidos: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  USA${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
