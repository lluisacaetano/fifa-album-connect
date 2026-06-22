// Alinha a ALEMANHA ao álbum oficial Panini 2026 (mesmo padrão da África do Sul).
// Fora do Brasil só ficam os 18 do álbum -> Jogadores E Figurinhas mostram os 18.
import { readFileSync, writeFileSync } from "node:fs";

// no = número da figurinha (GER<n>). Escudo=1, Foto=13.
// our = nome no NOSSO JSON; official = nome de exibição (Panini); add = não temos.
const ALBUM = [
  { no: 2, official: "Marc-André ter Stegen", add: true, position: "Goleiro", club: "Barcelona" },
  { no: 3, official: "Joshua Kimmich", our: "J. Kimmich", position: "Meio", club: "Bayern de Munique" },
  { no: 4, official: "Antonio Rüdiger", our: "Antonio Rüdiger", position: "Defesa", club: "Real Madrid" },
  { no: 5, official: "Jonathan Tah", our: "J. Tah", position: "Defesa", club: "Bayern de Munique" },
  { no: 6, official: "David Raum", our: "David Raum", position: "Defesa", club: "RB Leipzig" },
  { no: 7, official: "Pascal Groß", our: "P. Groß", position: "Meio", club: "Borussia Dortmund" },
  { no: 8, official: "Aleksandar Pavlović", our: "A. Pavlovic", position: "Meio", club: "Bayern de Munique" },
  { no: 9, official: "Jamal Musiala", our: "J. Musiala", position: "Meio", club: "Bayern de Munique" },
  { no: 10, official: "Florian Wirtz", our: "F. Wirtz", position: "Meio", club: "Liverpool" },
  { no: 11, official: "Leroy Sané", our: "L. Sané", position: "Ataque", club: "Galatasaray" },
  { no: 12, official: "Kai Havertz", our: "K. Havertz", position: "Ataque", club: "Arsenal" },
  { no: 14, official: "Niclas Füllkrug", add: true, position: "Ataque", club: "West Ham" },
  { no: 15, official: "Deniz Undav", our: "D. Undav", position: "Ataque", club: "Stuttgart" },
  { no: 16, official: "Maximilian Mittelstädt", add: true, position: "Defesa", club: "Stuttgart" },
  { no: 17, official: "Nico Schlotterbeck", our: "Nico Schlotterbeck", position: "Defesa", club: "Borussia Dortmund" },
  { no: 18, official: "Robin Koch", add: true, position: "Defesa", club: "Eintracht Frankfurt" },
  { no: 19, official: "Chris Führich", add: true, position: "Ataque", club: "Stuttgart" },
  { no: 20, official: "Robert Andrich", add: true, position: "Meio", club: "Bayer Leverkusen" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "GER", crest: "/teams/de/crest.png", photo: "/teams/de/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const de = data.de;
const byName = Object.fromEntries(de.players.map((p) => [p.name, p]));
let nextId = Math.max(...de.players.map((p) => p.id)) + 1;

const rebuilt = ALBUM.map((e) => {
  let p;
  if (e.add) {
    p = { id: nextId++, name: e.official, position: e.position, number: null, age: null, photo: null, club: e.club };
  } else {
    p = byName[e.our];
    if (!p) throw new Error(`não achei "${e.our}" nos dados`);
    p.name = e.official;
    if (e.position) p.position = e.position;
    if (e.club) p.club = e.club; // atualiza clube (muitos vinham "-")
  }
  p.inSquad = true;
  p.inAlbum = true;
  p.albumNo = e.no;
  return p;
});

de.players = rebuilt;
de.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`Alemanha: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  GER${p.albumNo}\t${p.name.padEnd(24)} ${p.club || "-"}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
