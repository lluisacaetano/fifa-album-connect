// Alinha o EGITO ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Mohamed El Shenawy", our: "Mohamed El Shenawy", position: "Goleiro" },
  { no: 3, official: "Mohamed Hany", our: "Mohamed Hany", position: "Defesa" },
  { no: 4, official: "Rami Rabia", our: "Rami Rabia", position: "Defesa" },
  { no: 5, official: "Mohamed Abdelmonem", our: "Mohamed Abdelmonem", position: "Defesa" },
  { no: 6, official: "Ahmed Nabil Koka", add: true, position: "Ataque" },
  { no: 7, official: "Marwan Attia", our: "Marwan Attia", position: "Meio" },
  { no: 8, official: "Hamdy Fathy", our: "Hamdi Fathy", position: "Meio" },
  { no: 9, official: "Mahmoud Trézéguet", our: "Trézéguet", position: "Ataque" },
  { no: 10, official: "Omar Marmoush", our: "Omar Marmoush", position: "Ataque" },
  { no: 11, official: "Mohamed Salah", our: "Mohamed Salah", position: "Ataque" },
  { no: 12, official: "Mostafa Mohamed", add: true, position: "Ataque" },
  { no: 14, official: "Ibrahim Adel", our: "Ibrahim Adel", position: "Meio" },
  { no: 15, official: "Zizo", our: "Ahmed Zizo", position: "Meio" },
  { no: 16, official: "Ahmed Sayed", add: true, position: "Ataque" },
  { no: 17, official: "Mostafa El Aash", add: true, position: "Defesa" },
  { no: 18, official: "Hossam Abdelmaguid", our: "Hossam Abdelmaguid", position: "Defesa" },
  { no: 19, official: "Nasser Maher", add: true, position: "Meio" },
  { no: 20, official: "Osama Faisal", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "EGY", crest: "/teams/eg/crest.png", photo: "/teams/eg/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const eg = data.eg;
const byName = Object.fromEntries(eg.players.map((p) => [p.name, p]));
let nextId = Math.max(...eg.players.map((p) => p.id)) + 1;

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

eg.players = rebuilt;
eg.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Egito: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  EGY${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
