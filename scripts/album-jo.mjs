// Alinha a JORDÂNIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Yazeed Abulaila", our: "Yazid Abu Layla", position: "Goleiro" },
  { no: 3, official: "Ehsan Haddad", our: "Ehsan Haddad", position: "Defesa" },
  { no: 4, official: "Yazan Al-Arab", our: "Yazan Al Arab", position: "Defesa" },
  { no: 5, official: "Abdallah Nasib", our: "Abdallah Naseeb", position: "Defesa" },
  { no: 6, official: "Salem Al-Ajalin", add: true, position: "Defesa" },
  { no: 7, official: "Nizar Al-Rashdan", our: "Nizar Al Rashdan", position: "Meio" },
  { no: 8, official: "Noor Al-Rawabdeh", our: "Noor Al Rawabdeh", position: "Meio" },
  { no: 9, official: "Mousa Al-Taamari", our: "Mousa Tamari", position: "Ataque" },
  { no: 10, official: "Mahmoud Al-Mardi", our: "Mahmoud Al Mardi", position: "Meio" },
  { no: 11, official: "Ali Olwan", our: "Ali Olwan", position: "Ataque" },
  { no: 12, official: "Yazan Al-Naimat", add: true, position: "Ataque" },
  { no: 14, official: "Ibrahim Sadeh", our: "Ibrahim Sa'deh", position: "Meio" },
  { no: 15, official: "Mohammad Abu Hasheesh", our: "M. Abu Hasheesh", position: "Defesa" },
  { no: 16, official: "Abdullah Al-Attar", add: true, position: "Defesa" },
  { no: 17, official: "Mohamed Abualnadi", our: "M. Abualnadi", position: "Defesa" },
  { no: 18, official: "Anas Al-Awadat", add: true, position: "Meio" },
  { no: 19, official: "Ibrahim Sabra", add: true, position: "Meio" },
  { no: 20, official: "Mohammed Abual Nada", add: true, position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "JOR", crest: "/teams/jo/crest.png", photo: "/teams/jo/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const jo = data.jo;
const byName = Object.fromEntries(jo.players.map((p) => [p.name, p]));
let nextId = Math.max(...jo.players.map((p) => p.id)) + 1;

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

jo.players = rebuilt;
jo.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Jordânia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  JOR${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
