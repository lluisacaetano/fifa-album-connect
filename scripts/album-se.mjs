// Alinha a SUÉCIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Viktor Johansson", our: "V. Johansson", position: "Goleiro" },
  { no: 3, official: "Emil Holm", add: true, position: "Defesa" },
  { no: 4, official: "Victor Lindelöf", our: "V. Lindelöf", position: "Defesa" },
  { no: 5, official: "Isak Hien", our: "I. Hien", position: "Defesa" },
  { no: 6, official: "Ludwig Augustinsson", add: true, position: "Defesa" },
  { no: 7, official: "Hugo Larsson", add: true, position: "Meio" },
  { no: 8, official: "Yasin Ayari", our: "Y. Ayari", position: "Meio" },
  { no: 9, official: "Dejan Kulusevski", add: true, position: "Meio" },
  { no: 10, official: "Emil Forsberg", add: true, position: "Meio" },
  { no: 11, official: "Anthony Elanga", our: "A. Elanga", position: "Ataque" },
  { no: 12, official: "Alexander Isak", our: "A. Isak", position: "Ataque" },
  { no: 14, official: "Viktor Gyökeres", our: "V. Gyökeres", position: "Ataque" },
  { no: 15, official: "Benjamin Nygren", our: "B. Nygren", position: "Ataque" },
  { no: 16, official: "Sebastian Nanasi", add: true, position: "Meio" },
  { no: 17, official: "Lucas Bergvall", our: "L. Bergvall", position: "Meio" },
  { no: 18, official: "Gustaf Nilsson", our: "G. Nilsson", position: "Ataque" },
  { no: 19, official: "Gabriel Gudmundsson", our: "G. Gudmundsson", position: "Defesa" },
  { no: 20, official: "Carl Starfelt", our: "C. Starfelt", position: "Defesa" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "SWE", crest: "/teams/se/crest.png", photo: "/teams/se/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const se = data.se;
const byName = Object.fromEntries(se.players.map((p) => [p.name, p]));
let nextId = Math.max(...se.players.map((p) => p.id)) + 1;

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

se.players = rebuilt;
se.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Suécia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  SWE${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
