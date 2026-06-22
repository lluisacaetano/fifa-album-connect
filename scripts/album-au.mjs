// Alinha a AUSTRÁLIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
// Fora do Brasil só ficam os 18 do álbum. Nomes exibidos = nomes oficiais (Panini).
import { readFileSync, writeFileSync } from "node:fs";

// no = nº da figurinha (AUS<n>). our = nome no NOSSO JSON; official = exibição; add = não temos.
const ALBUM = [
  { no: 2, official: "Mathew Ryan", our: "M. Ryan", position: "Goleiro" },
  { no: 3, official: "Gethin Jones", add: true, position: "Defesa" },
  { no: 4, official: "Harry Souttar", our: "H. Souttar", position: "Defesa" },
  { no: 5, official: "Kye Rowles", add: true, position: "Defesa" },
  { no: 6, official: "Aziz Behich", our: "A. Behich", position: "Defesa" },
  { no: 7, official: "Jackson Irvine", our: "J. Irvine", position: "Meio" },
  { no: 8, official: "Aiden O'Neill", our: "A. O Neill", position: "Meio" },
  { no: 9, official: "Connor Metcalfe", our: "C. Metcalfe", position: "Meio" },
  { no: 10, official: "Riley McGree", add: true, position: "Meio" },
  { no: 11, official: "Craig Goodwin", add: true, position: "Ataque" },
  { no: 12, official: "Kusini Yengi", our: "T. Yengi", position: "Ataque" },
  { no: 14, official: "Martin Boyle", add: true, position: "Ataque" },
  { no: 15, official: "Nishan Velupillay", our: "N. Velupillay", position: "Ataque" },
  { no: 16, official: "Brandon Borrello", add: true, position: "Ataque" },
  { no: 17, official: "Cameron Burgess", our: "C. Burgess", position: "Defesa" },
  { no: 18, official: "Alessandro Circati", our: "A. Circati", position: "Defesa" },
  { no: 19, official: "Jordy Bos", our: "J. Bos", position: "Defesa" },
  { no: 20, official: "Nestory Irankunda", our: "N. Irankunda", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "AUS", crest: "/teams/au/crest.png", photo: "/teams/au/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const au = data.au;
const byName = Object.fromEntries(au.players.map((p) => [p.name, p]));
let nextId = Math.max(...au.players.map((p) => p.id)) + 1;

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

au.players = rebuilt;
au.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Austrália: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  AUS${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
