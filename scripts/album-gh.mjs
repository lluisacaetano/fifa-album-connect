// Alinha GANA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Lawrence Ati-Zigi", our: "L. Zigi", position: "Goleiro" },
  { no: 3, official: "Tariq Lamptey", add: true, position: "Defesa" },
  { no: 4, official: "Alexander Djiku", add: true, position: "Defesa" },
  { no: 5, official: "Mohammed Salisu", add: true, position: "Defesa" },
  { no: 6, official: "Gideon Mensah", our: "G. Mensah", position: "Defesa" },
  { no: 7, official: "Thomas Partey", our: "Thomas Partey", position: "Meio" },
  { no: 8, official: "Elisha Owusu", our: "E. Owusu", position: "Meio" },
  { no: 9, official: "Mohammed Kudus", add: true, position: "Meio" },
  { no: 10, official: "Antoine Semenyo", our: "Antoine Semenyo", position: "Ataque" },
  { no: 11, official: "Iñaki Williams", our: "I. Williams", position: "Ataque" },
  { no: 12, official: "Jordan Ayew", our: "J. Ayew", position: "Ataque" },
  { no: 14, official: "Ernest Nuamah", our: "E. Nuamah", position: "Ataque" },
  { no: 15, official: "Kamaldeen Sulemana", our: "K. Sulemana", position: "Ataque" },
  { no: 16, official: "Ibrahim Osman", add: true, position: "Ataque" },
  { no: 17, official: "Jerome Opoku", our: "J. Opoku", position: "Defesa" },
  { no: 18, official: "Abdul Mumin", our: "A. Mumin", position: "Defesa" },
  { no: 19, official: "Salis Abdul Samed", add: true, position: "Meio" },
  { no: 20, official: "Jerry Afriyie", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "GHA", crest: "/teams/gh/crest.png", photo: "/teams/gh/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const gh = data.gh;
const byName = Object.fromEntries(gh.players.map((p) => [p.name, p]));
let nextId = Math.max(...gh.players.map((p) => p.id)) + 1;

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

gh.players = rebuilt;
gh.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Gana: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  GHA${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
