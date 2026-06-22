// Alinha o SENEGAL ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Édouard Mendy", our: "É. Mendy", position: "Goleiro" },
  { no: 3, official: "Krépin Diatta", our: "Krépin Diatta", position: "Defesa" },
  { no: 4, official: "Kalidou Koulibaly", our: "Kalidou Koulibaly", position: "Defesa" },
  { no: 5, official: "Moussa Niakhaté", our: "Moussa Niakhaté", position: "Defesa" },
  { no: 6, official: "Ismail Jakobs", our: "I. Jakobs", position: "Defesa" },
  { no: 7, official: "Pape Matar Sarr", our: "P. Sarr", position: "Meio" },
  { no: 8, official: "Lamine Camara", our: "L. Camara", position: "Meio" },
  { no: 9, official: "Idrissa Gana Gueye", our: "Idrissa Gueye", position: "Meio" },
  { no: 10, official: "Iliman Ndiaye", our: "I. Ndiaye", position: "Ataque" },
  { no: 11, official: "Ismaïla Sarr", our: "I. Sarr", position: "Ataque" },
  { no: 12, official: "Nicolas Jackson", our: "N. Jackson", position: "Ataque" },
  { no: 14, official: "Habib Diallo", add: true, position: "Ataque" },
  { no: 15, official: "Boulaye Dia", add: true, position: "Ataque" },
  { no: 16, official: "Chérif Ndiaye", our: "C. Ndiaye", position: "Ataque" },
  { no: 17, official: "El Hadji Malick Diouf", add: true, position: "Defesa" },
  { no: 18, official: "Abdou Diallo", add: true, position: "Defesa" },
  { no: 19, official: "Formose Mendy", add: true, position: "Defesa" },
  { no: 20, official: "Yehvann Diouf", our: "Y. Diouf", position: "Goleiro" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "SEN", crest: "/teams/sn/crest.png", photo: "/teams/sn/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const sn = data.sn;
const byName = Object.fromEntries(sn.players.map((p) => [p.name, p]));
let nextId = Math.max(...sn.players.map((p) => p.id)) + 1;

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

sn.players = rebuilt;
sn.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Senegal: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  SEN${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
