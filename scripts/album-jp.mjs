// Alinha o JAPÃO ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Zion Suzuki", our: "Z. Suzuki", position: "Goleiro" },
  { no: 3, official: "Yukinari Sugawara", our: "Y. Sugawara", position: "Defesa" },
  { no: 4, official: "Kō Itakura", our: "K. Itakura", position: "Defesa" },
  { no: 5, official: "Shōgo Taniguchi", our: "S. Taniguchi", position: "Defesa" },
  { no: 6, official: "Hiroki Itō", our: "H. Ito", position: "Defesa" },
  { no: 7, official: "Wataru Endō", add: true, position: "Meio" },
  { no: 8, official: "Hidemasa Morita", add: true, position: "Meio" },
  { no: 9, official: "Takefusa Kubo", our: "T. Kubo", position: "Ataque" },
  { no: 10, official: "Daichi Kamada", our: "D. Kamada", position: "Meio" },
  { no: 11, official: "Kaoru Mitoma", add: true, position: "Ataque" },
  { no: 12, official: "Ayase Ueda", our: "A. Ueda", position: "Ataque" },
  { no: 14, official: "Ritsu Dōan", our: "R. Doan", position: "Ataque" },
  { no: 15, official: "Junya Itō", our: "J. Ito", position: "Ataque" },
  { no: 16, official: "Keito Nakamura", our: "Keito Nakamura", position: "Ataque" },
  { no: 17, official: "Kōki Machida", add: true, position: "Defesa" },
  { no: 18, official: "Kōta Takai", add: true, position: "Defesa" },
  { no: 19, official: "Reo Hatate", add: true, position: "Meio" },
  { no: 20, official: "Shunsuke Mito", add: true, position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "JPN", crest: "/teams/jp/crest.png", photo: "/teams/jp/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const jp = data.jp;
const byName = Object.fromEntries(jp.players.map((p) => [p.name, p]));
let nextId = Math.max(...jp.players.map((p) => p.id)) + 1;

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

jp.players = rebuilt;
jp.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Japão: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  JPN${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
