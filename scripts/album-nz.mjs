// Alinha a NOVA ZELÂNDIA ao álbum oficial Panini 2026.
// Os dados que tínhamos do "nz" estavam errados (elenco trocado), então montamos
// os 18 oficiais do zero (fotos vêm do TheSportsDB/manual depois).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Max Crocombe", position: "Goleiro" },
  { no: 3, official: "Tim Payne", position: "Defesa" },
  { no: 4, official: "Michael Boxall", position: "Defesa" },
  { no: 5, official: "Tyler Bindon", position: "Defesa" },
  { no: 6, official: "Liberato Cacace", position: "Defesa" },
  { no: 7, official: "Joe Bell", position: "Meio" },
  { no: 8, official: "Marko Stamenić", position: "Meio" },
  { no: 9, official: "Sarpreet Singh", position: "Meio" },
  { no: 10, official: "Elijah Just", position: "Ataque" },
  { no: 11, official: "Chris Wood", position: "Ataque" },
  { no: 12, official: "Ben Waine", position: "Ataque" },
  { no: 14, official: "Kosta Barbarouses", position: "Ataque" },
  { no: 15, official: "Callan Elliot", position: "Defesa" },
  { no: 16, official: "Matt Garbett", position: "Meio" },
  { no: 17, official: "Alex Paulsen", position: "Goleiro" },
  { no: 18, official: "Finn Surman", position: "Defesa" },
  { no: 19, official: "Ben Old", position: "Ataque" },
  { no: 20, official: "Jesse Randall", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "NZL", crest: "/teams/nz/crest.png", photo: "/teams/nz/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const nz = data.nz;
let nextId = 1;

nz.players = ALBUM.map((e) => ({
  id: nextId++,
  name: e.official,
  position: e.position,
  number: null,
  age: null,
  photo: null,
  club: null,
  inSquad: true,
  inAlbum: true,
  albumNo: e.no,
}));
nz.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Nova Zelândia: ${nz.players.length} jogadores (álbum, todos novos).`);
for (const p of nz.players) console.log(`  NZL${p.albumNo}\t${p.name}`);
