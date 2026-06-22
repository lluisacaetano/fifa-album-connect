// Alinha a COSTA DO MARFIM ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Yahia Fofana", our: "Y. Fofana", position: "Goleiro" },
  { no: 3, official: "Guéla Doué", our: "G. Doué", position: "Defesa" },
  { no: 4, official: "Evan Ndicka", our: "E. Ndicka", position: "Defesa" },
  { no: 5, official: "Ousmane Diomandé", our: "O. Diomande", position: "Defesa" },
  { no: 6, official: "Ghislain Konan", our: "G. Konan", position: "Defesa" },
  { no: 7, official: "Franck Kessié", our: "F. Kessié", position: "Meio" },
  { no: 8, official: "Jean Michaël Seri", our: "J. Seri", position: "Meio" },
  { no: 9, official: "Seko Fofana", our: "S. Fofana", position: "Meio" },
  { no: 10, official: "Simon Adingra", our: "S. Adingra", position: "Ataque" },
  { no: 11, official: "Sébastien Haller", add: true, position: "Ataque" },
  { no: 12, official: "Nicolas Pépé", our: "N. Pépé", position: "Ataque" },
  { no: 14, official: "Amad Diallo", our: "A. Diallo", position: "Ataque" },
  { no: 15, official: "Karim Konaté", add: true, position: "Ataque" },
  { no: 16, official: "Evann Guessand", our: "E. Guessand", position: "Ataque" },
  { no: 17, official: "Odilon Kossounou", our: "O. Kossounou", position: "Defesa" },
  { no: 18, official: "Wilfried Singo", our: "W. Singo", position: "Defesa" },
  { no: 19, official: "Christian Kouamé", add: true, position: "Ataque" },
  { no: 20, official: "Hamed Traorè", add: true, position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "CIV", crest: "/teams/ci/crest.png", photo: "/teams/ci/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const ci = data.ci;
const byName = Object.fromEntries(ci.players.map((p) => [p.name, p]));
let nextId = Math.max(...ci.players.map((p) => p.id)) + 1;

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

ci.players = rebuilt;
ci.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Costa do Marfim: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  CIV${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
