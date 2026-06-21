// Junta todas as seleções num formato único para o álbum e o carrossel de jogadores.
// Brasil usa o elenco curado (players.ts, com foto real de todos).
// As demais vêm da TheSportsDB (squads.generated.json).
import rawSquads from "./squads.generated.json";
import { players as brPlayers } from "./players";
import { nations } from "./nations";

export type SquadPlayer = {
  id: number;
  name: string;
  position: string;
  number?: string | null;
  photo: string | null;
  desc?: string | null;
};

export type CountrySquad = {
  code: string;
  name: string;
  colors: [string, string];
  players: SquadPlayer[];
};

const meta = Object.fromEntries(nations.map((n) => [n.code, n]));

const brazil: CountrySquad = {
  code: "br",
  name: "Brasil",
  colors: meta["br"]?.colors ?? ["#009739", "#FFDF00"],
  players: brPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    number: String(p.number),
    photo: p.photo,
  })),
};

const others: CountrySquad[] = Object.entries(rawSquads as Record<string, SquadPlayer[]>)
  .map(([code, players]) => ({
    code,
    name: meta[code]?.name ?? code,
    colors: meta[code]?.colors ?? ["#009739", "#FFDF00"],
    players,
  }))
  .filter((s) => s.players.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name, "pt"));

// Brasil sempre primeiro, depois as outras em ordem alfabética.
export const squads: CountrySquad[] = [brazil, ...others];

export function squadByCode(code: string): CountrySquad | undefined {
  return squads.find((s) => s.code === code);
}
