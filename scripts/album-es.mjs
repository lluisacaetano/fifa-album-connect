// Alinha a ESPANHA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Unai Simón", our: "Unai Simón", position: "Goleiro" },
  { no: 3, official: "Dani Carvajal", add: true, position: "Defesa" },
  { no: 4, official: "Robin Le Normand", add: true, position: "Defesa" },
  { no: 5, official: "Pau Cubarsí", our: "Pau Cubarsí Paredes", position: "Defesa" },
  { no: 6, official: "Marc Cucurella", our: "Marc Cucurella", position: "Defesa" },
  { no: 7, official: "Rodri", our: "Rodri", position: "Meio" },
  { no: 8, official: "Pedri", our: "Pedri", position: "Meio" },
  { no: 9, official: "Fabián Ruiz", our: "Fabián Ruiz", position: "Meio" },
  { no: 10, official: "Lamine Yamal", our: "Lamine Yamal", position: "Ataque" },
  { no: 11, official: "Nico Williams", our: "Nico Williams", position: "Ataque" },
  { no: 12, official: "Álvaro Morata", add: true, position: "Ataque" },
  { no: 14, official: "Dani Olmo", our: "Dani Olmo", position: "Meio" },
  { no: 15, official: "Mikel Oyarzabal", our: "Mikel Oyarzabal", position: "Ataque" },
  { no: 16, official: "Fermín López", add: true, position: "Meio" },
  { no: 17, official: "Dean Huijsen", add: true, position: "Defesa" },
  { no: 18, official: "Alejandro Balde", add: true, position: "Defesa" },
  { no: 19, official: "Martín Zubimendi", our: "Martín Zubimendi", position: "Meio" },
  { no: 20, official: "Samu Aghehowa", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "ESP", crest: "/teams/es/crest.png", photo: "/teams/es/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const es = data.es;
const byName = Object.fromEntries(es.players.map((p) => [p.name, p]));
let nextId = Math.max(...es.players.map((p) => p.id)) + 1;

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

es.players = rebuilt;
es.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Espanha: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  ESP${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
