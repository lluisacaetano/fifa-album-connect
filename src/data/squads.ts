// Junta todas as 48 seleções num formato único para o álbum e o carrossel.
// Todos os elencos vêm da API-Football (squads.generated.json): nome, idade, nº,
// posição, foto e — quando enriquecido — clube e estatísticas da temporada.
import rawSquads from "./squads.generated.json";
import overrides from "./photo-overrides.json";
import { nations } from "./nations";

// Ajustes manuais de foto por jogador (zoom), chave "<code>-<number>".
const photoOverrides = overrides as Record<string, { scale?: number }>;

export type SquadPlayer = {
  id: number;
  name: string;
  position: string;
  number?: string | null;
  age?: number | null;
  photo: string | null;
  photoCutout?: boolean; // true = foto recortada hi-res (não a foto pequena da API)
  photoScale?: number; // zoom individual da foto no card (ex.: 1.4 = 40% maior)
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

const squadList: CountrySquad[] = Object.entries(generated)
  .map(([code, squad]) => ({
    code,
    name: squad.name ?? meta[code]?.name ?? code,
    colors: meta[code]?.colors ?? DEFAULT_COLORS,
    players: byNumber(squad.players ?? [])
      .slice(0, 26) // elenco da Copa = máx. 26
      .map((p) => {
        const ov = photoOverrides[`${code}-${p.number}`];
        return ov?.scale ? { ...p, photoScale: ov.scale } : p;
      }),
  }))
  .filter((s) => s.players.length > 0)
  // Brasil sempre primeiro, depois as outras em ordem alfabética.
  .sort((a, b) => (a.code === "br" ? -1 : b.code === "br" ? 1 : a.name.localeCompare(b.name, "pt")));

export const squads: CountrySquad[] = squadList;

export function squadByCode(code: string): CountrySquad | undefined {
  return squads.find((s) => s.code === code);
}
