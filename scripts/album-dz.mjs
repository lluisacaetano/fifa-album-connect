// Alinha a ARGÉLIA ao álbum oficial Panini 2026 (mesmo padrão das outras).
// Fora do Brasil só ficam os 18 do álbum. Nomes exibidos = nomes oficiais (Panini).
import { readFileSync, writeFileSync } from "node:fs";

// no = nº da figurinha (DZA<n>). our = nome no NOSSO JSON; official = exibição; add = não temos.
const ALBUM = [
  { no: 2, official: "Alexis Guendouz", add: true, position: "Goleiro" },
  { no: 3, official: "Youcef Atal", add: true, position: "Defesa", club: "Al-Sadd" },
  { no: 4, official: "Mohamed Amine Tougaï", our: "M. Tougai", position: "Defesa" },
  { no: 5, official: "Ramy Bensebaïni", our: "R. Bensebaïni", position: "Defesa" },
  { no: 6, official: "Jaouen Hadjam", our: "J. Hadjam", position: "Defesa" },
  { no: 7, official: "Ismaël Bennacer", add: true, position: "Meio", club: "AC Milan" },
  { no: 8, official: "Hicham Boudaoui", our: "H. Boudaoui", position: "Meio" },
  { no: 9, official: "Adem Zorgane", add: true, position: "Meio" },
  { no: 10, official: "Farès Chaïbi", our: "Farès Chaïbi", position: "Meio" },
  { no: 11, official: "Mohamed El Amine Amoura", our: "Mohamed Amoura", position: "Ataque" },
  { no: 12, official: "Riyad Mahrez", our: "Riyad Mahrez", position: "Ataque" },
  { no: 14, official: "Saïd Benrahma", add: true, position: "Ataque" },
  { no: 15, official: "Anis Hadj Moussa", our: "A. Hadj-Moussa", position: "Ataque" },
  { no: 16, official: "Amine Gouiri", our: "Amine Gouiri", position: "Ataque" },
  { no: 17, official: "Baghdad Bounedjah", add: true, position: "Ataque", club: "Al-Sadd" },
  { no: 18, official: "Yassine Benzia", add: true, position: "Ataque" },
  { no: 19, official: "Kevin Guitoun", add: true, position: "Meio" },
  { no: 20, official: "Aïssa Mandi", our: "A. Mandi", position: "Defesa" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "DZA", crest: "/teams/dz/crest.png", photo: "/teams/dz/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const dz = data.dz;
const byName = Object.fromEntries(dz.players.map((p) => [p.name, p]));
let nextId = Math.max(...dz.players.map((p) => p.id)) + 1;

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

dz.players = rebuilt;
dz.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Argélia: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  DZA${p.albumNo}\t${p.name.padEnd(26)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
