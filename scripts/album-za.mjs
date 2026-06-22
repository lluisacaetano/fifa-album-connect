// Alinha a ÁFRICA DO SUL ao álbum oficial Panini 2026.
// Fora do Brasil só ficam os 18 do álbum -> Jogadores E Figurinhas mostram os mesmos 18.
// Reconstrói za.players com exatamente os 18 (mantém dados/foto dos que já temos, adiciona os que faltam).
import { readFileSync, writeFileSync } from "node:fs";

// Ordem do álbum: no = número da figurinha (RSA<n>). Escudo=1, Foto=13.
// our  = nome no NOSSO JSON (pra reaproveitar foto/bio); official = nome de exibição (Panini).
// add  = jogador que não temos (cria do zero).
const ALBUM = [
  { no: 2, official: "Ronwen Williams", our: "Ronwen Hayden Williams", position: "Goleiro" },
  { no: 3, official: "Khuliso Mudau", our: "Khuliso Johnson Mudau", position: "Defesa" },
  { no: 4, official: "Siyabonga Ngezana", add: true, position: "Defesa", club: "FCSB" },
  { no: 5, official: "Mothobi Mvala", add: true, position: "Defesa", club: "Mamelodi Sundowns" },
  { no: 6, official: "Aubrey Modiba", our: "Aubrey Maphosa Modiba", position: "Defesa" },
  { no: 7, official: "Teboho Mokoena", our: "Teboho Mokoena", position: "Meio" },
  { no: 8, official: "Sphephelo Sithole", our: "Sphephelo S'Miso Sithole", position: "Meio" },
  { no: 9, official: "Oswin Appollis", our: "Oswin Reagan Appollis", position: "Ataque" },
  { no: 10, official: "Themba Zwane", our: "Themba Zwane", position: "Meio" },
  { no: 11, official: "Elias Mokwana", add: true, position: "Ataque", club: "Espérance de Tunis" },
  { no: 12, official: "Percy Tau", add: true, position: "Ataque", club: "Qatar SC" },
  { no: 14, official: "Relebohile Mofokeng", our: "Relebohile Mofokeng", position: "Ataque" },
  { no: 15, official: "Lyle Foster", our: "L. Foster", position: "Ataque", club: "Burnley" },
  { no: 16, official: "Iqraam Rayners", our: "Iqraam Rayners", position: "Ataque" },
  { no: 17, official: "Evidence Makgopa", our: "Sekotori Evidence Makgopa", position: "Ataque" },
  { no: 18, official: "Nkosinathi Sibisi", our: "Nkosinathi Sibisi", position: "Defesa" },
  { no: 19, official: "Fawaaz Basadien", add: true, position: "Defesa", club: "Stellenbosch" },
  { no: 20, official: "Jayden Adams", our: "Jayden Oswin Adams", position: "Meio" },
];
const ALBUM_META = { crestNo: 1, photoNo: 13, prefix: "RSA", crest: "/teams/za/crest.png", photo: "/teams/za/team.jpg" };

const data = JSON.parse(readFileSync("src/data/squads.generated.json"));
const za = data.za;
const byName = Object.fromEntries(za.players.map((p) => [p.name, p]));
let nextId = Math.max(...za.players.map((p) => p.id)) + 1;

const rebuilt = ALBUM.map((e) => {
  let p;
  if (e.add) {
    p = { id: nextId++, name: e.official, position: e.position, number: null, age: null, photo: null, club: e.club };
  } else {
    p = byName[e.our];
    if (!p) throw new Error(`não achei "${e.our}" nos dados`);
    p.name = e.official; // nome oficial de exibição
    if (e.position) p.position = e.position;
    if (e.club && (!p.club || p.club === "-")) p.club = e.club;
    if (e.our === "L. Foster") for (const k of ["photo", "photoCutout", "photoLocal", "photoTsdbDone"]) delete p[k]; // foto faltava
  }
  p.inSquad = true;
  p.inAlbum = true;
  p.albumNo = e.no;
  return p;
});

za.players = rebuilt;
za.album = ALBUM_META;
writeFileSync("src/data/squads.generated.json", JSON.stringify(data, null, 1));
console.log(`África do Sul: ${rebuilt.length} jogadores (álbum).`);
for (const p of rebuilt) console.log(`  RSA${p.albumNo}\t${p.name.padEnd(22)} ${p.club || "-"}${p.photoCutout ? " · foto✓" : " · SEM FOTO"}`);
