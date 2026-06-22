// Alinha a COREIA DO SUL ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Jo Hyeon-woo", our: "Jo Hyeon-Woo", position: "Goleiro" },
  { no: 3, official: "Seol Young-woo", our: "Seol Young-Woo", position: "Defesa" },
  { no: 4, official: "Kim Min-jae", our: "Kim Min-Jae", position: "Defesa" },
  { no: 5, official: "Cho Yu-min", add: true, position: "Defesa" },
  { no: 6, official: "Lee Tae-seok", our: "Lee Tae-Seok", position: "Defesa" },
  { no: 7, official: "Hwang In-beom", our: "Hwang In-Beom", position: "Meio" },
  { no: 8, official: "Park Yong-woo", add: true, position: "Meio" },
  { no: 9, official: "Lee Kang-in", our: "Lee Kang-In", position: "Meio" },
  { no: 10, official: "Son Heung-min", our: "Son Heung-Min", position: "Ataque" },
  { no: 11, official: "Hwang Hee-chan", our: "Hwang Hee-Chan", position: "Ataque" },
  { no: 12, official: "Oh Hyeon-gyu", our: "Oh Hyeon-Gyu", position: "Ataque" },
  { no: 14, official: "Bae Jun-ho", our: "Bae Jun-Ho", position: "Meio" },
  { no: 15, official: "Yang Hyun-jun", our: "Yang Hyun-Jun", position: "Ataque" },
  { no: 16, official: "Yang Min-hyeok", add: true, position: "Ataque" },
  { no: 17, official: "Lee Han-beom", our: "Lee Han-Beom", position: "Meio" },
  { no: 18, official: "Hwang Jae-won", add: true, position: "Defesa" },
  { no: 19, official: "Hong Hyun-seok", add: true, position: "Meio" },
  { no: 20, official: "Oh Se-hun", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "KOR", crest: "/teams/kr/crest.png", photo: "/teams/kr/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const kr = data.kr;
const byName = Object.fromEntries(kr.players.map((p) => [p.name, p]));
let nextId = Math.max(...kr.players.map((p) => p.id)) + 1;

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

kr.players = rebuilt;
kr.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Coreia do Sul: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  KOR${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
