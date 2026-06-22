// Alinha a ARÁBIA SAUDITA ao álbum oficial Panini 2026 (mesmo padrão das outras).
// Fora do Brasil só ficam os 18 do álbum. Nomes exibidos = nomes oficiais (Panini).
import { readFileSync, writeFileSync } from "node:fs";

// no = nº da figurinha (KSA<n>). our = nome no NOSSO JSON; official = exibição; add = não temos.
const ALBUM = [
  { no: 2, official: "Nawaf Alaqidi", our: "Nawaf Al Aqidi", position: "Goleiro" },
  { no: 3, official: "Abdulrahman Al-Sanbi", add: true, position: "Meio" },
  { no: 4, official: "Saud Abdulhamid", our: "Saud Abdulhamid", position: "Defesa" },
  { no: 5, official: "Nawaf Bouwashl", our: "Nawaf Boushal", position: "Defesa" },
  { no: 6, official: "Jihad Thakri", our: "J. Thakri", position: "Defesa" },
  { no: 7, official: "Moteb Al-Harbi", our: "Moteb Al Harbi", position: "Defesa" },
  { no: 8, official: "Hassan Altambakti", our: "Hassan Tambakti", position: "Defesa" },
  { no: 9, official: "Musab Aljuwayr", our: "Musab Al Juwayr", position: "Meio" },
  { no: 10, official: "Ziyad Aljohani", our: "Ziyad Al Johani", position: "Meio" },
  { no: 11, official: "Abdullah Alkhaibari", our: "Abdullah Al Khaibari", position: "Meio" },
  { no: 12, official: "Nasser Aldawsari", our: "Nasser Al Dawsari", position: "Meio" },
  { no: 14, official: "Saleh Abu Alshamat", our: "Mohammed Abu Al Shamat", position: "Meio" },
  { no: 15, official: "Marwan Alsahafi", add: true, position: "Ataque" },
  { no: 16, official: "Salem Aldawsari", our: "Salem Al Dawsari", position: "Ataque" },
  { no: 17, official: "Abdulrahman Al-Aboud", add: true, position: "Ataque" },
  { no: 18, official: "Feras Albrikan", our: "Feras Al Brikan", position: "Ataque" },
  { no: 19, official: "Saleh Alshehri", our: "Saleh Al Shehri", position: "Ataque" },
  { no: 20, official: "Abdullah Al-Hamdan", our: "Abdullah Al Hamdan", position: "Ataque" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "KSA", crest: "/teams/sa/crest.png", photo: "/teams/sa/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const sa = data.sa;
const byName = Object.fromEntries(sa.players.map((p) => [p.name, p]));
let nextId = Math.max(...sa.players.map((p) => p.id)) + 1;

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

sa.players = rebuilt;
sa.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Arábia Saudita: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  KSA${p.albumNo}\t${p.name.padEnd(24)}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
