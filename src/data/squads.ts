// Junta todas as seleções num formato único para o álbum e o carrossel de jogadores.
// Brasil usa o elenco curado (players.ts, com foto real + bio de todos).
// As demais vêm da API-Football (squads.generated.json): nome, idade, nº, posição,
// foto oficial e — quando enriquecido — clube e estatísticas da temporada.
import rawSquads from "./squads.generated.json";
import brDesc from "./players-br-desc.json";
import { players as brPlayers } from "./players";
import { nations } from "./nations";

const brDescById = brDesc as Record<string, string>;

export type SquadPlayer = {
  id: number;
  name: string;
  position: string;
  number?: string | null;
  age?: number | null;
  photo: string | null;
  club?: string | null;
  goals?: number | null;
  assists?: number | null;
  apps?: number | null;
  desc?: string | null;
};

export type CountrySquad = {
  code: string;
  name: string;
  colors: [string, string];
  players: SquadPlayer[];
};

type GeneratedSquad = { name: string; players: SquadPlayer[] };
const generated = rawSquads as Record<string, GeneratedSquad>;

const meta = Object.fromEntries(nations.map((n) => [n.code, n]));
const DEFAULT_COLORS: [string, string] = ["#009739", "#FFDF00"];

// Ordena as figurinhas pelo número da camisa (1, 2, 3...); sem número vai pro fim.
function byNumber(players: SquadPlayer[]): SquadPlayer[] {
  return [...players].sort((a, b) => {
    const na = a.number != null && a.number !== "" ? Number(a.number) : Infinity;
    const nb = b.number != null && b.number !== "" ? Number(b.number) : Infinity;
    return na - nb || a.name.localeCompare(b.name, "pt");
  });
}

const brazil: CountrySquad = {
  code: "br",
  name: "Brasil",
  colors: meta["br"]?.colors ?? DEFAULT_COLORS,
  players: byNumber(
    brPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      number: String(p.number),
      photo: p.photo,
      desc: brDescById[String(p.id)] ?? null,
    })),
  ),
};

const others: CountrySquad[] = Object.entries(generated)
  .filter(([code]) => code !== "br") // Brasil é curado acima
  .map(([code, squad]) => ({
    code,
    name: squad.name ?? meta[code]?.name ?? code,
    colors: meta[code]?.colors ?? DEFAULT_COLORS,
    players: byNumber(squad.players ?? []),
  }))
  .filter((s) => s.players.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name, "pt"));

// Brasil sempre primeiro, depois as outras em ordem alfabética.
export const squads: CountrySquad[] = [brazil, ...others];

export function squadByCode(code: string): CountrySquad | undefined {
  return squads.find((s) => s.code === code);
}
