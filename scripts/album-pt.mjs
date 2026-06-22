// Alinha PORTUGAL ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Diogo Costa", our: "Diogo Costa", position: "Goleiro" },
  { no: 3, official: "João Cancelo", our: "João Cancelo", position: "Defesa" },
  { no: 4, official: "Rúben Dias", our: "Rúben Dias", position: "Defesa" },
  { no: 5, official: "Gonçalo Inácio", our: "Gonçalo Inácio", position: "Defesa" },
  { no: 6, official: "Nuno Mendes", our: "Nuno Mendes", position: "Defesa" },
  { no: 7, official: "João Neves", our: "João Neves", position: "Meio" },
  { no: 8, official: "Vitinha", our: "Vitinha", position: "Meio" },
  { no: 9, official: "Bruno Fernandes", our: "Bruno Fernandes", position: "Meio" },
  { no: 10, official: "Rafael Leão", our: "Rafael Leão", position: "Ataque" },
  { no: 11, official: "Bernardo Silva", our: "Bernardo Silva", position: "Meio" },
  { no: 12, official: "Cristiano Ronaldo", our: "Cristiano Ronaldo", position: "Ataque" },
  { no: 14, official: "Gonçalo Ramos", our: "Gonçalo Ramos", position: "Ataque" },
  { no: 15, official: "Francisco Conceição", our: "Francisco Conceição", position: "Ataque" },
  { no: 16, official: "Pedro Neto", our: "Pedro Neto", position: "Ataque" },
  { no: 17, official: "João Félix", our: "João Félix", position: "Ataque" },
  { no: 18, official: "António Silva", add: true, position: "Defesa" },
  { no: 19, official: "Diogo Dalot", our: "Diogo Dalot", position: "Defesa" },
  { no: 20, official: "Rodrigo Mora", add: true, position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "POR", crest: "/teams/pt/crest.png", photo: "/teams/pt/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const pt = data.pt;
const byName = Object.fromEntries(pt.players.map((p) => [p.name, p]));
let nextId = Math.max(...pt.players.map((p) => p.id)) + 1;

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

pt.players = rebuilt;
pt.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Portugal: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  POR${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
