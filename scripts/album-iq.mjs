// Alinha o IRAQUE ao álbum oficial Panini 2026 (mesmo padrão das outras).
import { readFileSync, writeFileSync } from "node:fs";

const ALBUM = [
  { no: 2, official: "Jalal Hassan", our: "Jalal Hassan Hachim", position: "Goleiro" },
  { no: 3, official: "Hussein Ali", our: "Hussein Ali", position: "Defesa" },
  { no: 4, official: "Rebin Sulaka", our: "Rebin Solaka", position: "Defesa" },
  { no: 5, official: "Frans Putros", our: "Frans Putros", position: "Defesa" },
  { no: 6, official: "Ali Adnan", add: true, position: "Defesa" },
  { no: 7, official: "Osama Rashid", add: true, position: "Meio" },
  { no: 8, official: "Zidane Iqbal", our: "Zidane Iqbal", position: "Meio" },
  { no: 9, official: "Amir Al-Ammari", our: "Amir Al Ammari", position: "Meio" },
  { no: 10, official: "Ibrahim Bayesh", our: "Ibraheem Bayesh", position: "Ataque" },
  { no: 11, official: "Aymen Hussein", our: "Aymen Hussein", position: "Ataque" },
  { no: 12, official: "Ali Jasim", our: "A. Jasim", position: "Ataque" },
  { no: 14, official: "Youssef Amyn", our: "Youssef Amyn", position: "Ataque" },
  { no: 15, official: "Montader Madjed", add: true, position: "Meio" },
  { no: 16, official: "Danilo Al-Saed", add: true, position: "Defesa" },
  { no: 17, official: "Merchas Doski", our: "Merchas Doski", position: "Defesa" },
  { no: 18, official: "Manaf Younis", our: "Munaf Younus", position: "Meio" },
  { no: 19, official: "Akam Hashim", our: "A. Y. Hashim", position: "Meio" },
  { no: 20, official: "Ali Al-Hamadi", our: "Ali Al Hamadi", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "IRQ", crest: "/teams/iq/crest.png", photo: "/teams/iq/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const iq = data.iq;
const byName = Object.fromEntries(iq.players.map((p) => [p.name, p]));
let nextId = Math.max(...iq.players.map((p) => p.id)) + 1;

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

iq.players = rebuilt;
iq.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Iraque: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  IRQ${p.albumNo}\t${p.name.padEnd(22)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
