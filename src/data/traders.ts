import { squads } from "@/data/squads";

// "Banco de dados" simulado de colecionadores (sem backend).
// Gerado de forma DETERMINÍSTICA — mesma lista no servidor e no cliente,
// evitando divergência de hidratação no mapa.

export type Trader = {
  id: number;
  name: string;
  city: string;
  distance: string;
  rating: number | null; // média de avaliações (null = sem avaliações)
  has: string[]; // figurinhas que tem repetidas (para trocar)
  wants: string[]; // figurinhas que procura
  lat: number;
  lng: number;
  avatar: string;
  isMe?: boolean; // marca o próprio usuário no mapa
  uid?: string; // presente só nos colecionadores reais (Firestore)
  photo?: string; // foto de perfil (colecionadores reais)
  hasStickers?: { code: string; name: string }[]; // tem para trocar (número + nome)
};

const CITIES: { city: string; lat: number; lng: number }[] = [
  { city: "São Paulo", lat: -23.55, lng: -46.63 },
  { city: "Rio de Janeiro", lat: -22.9, lng: -43.2 },
  { city: "Belo Horizonte", lat: -19.92, lng: -43.93 },
  { city: "Brasília", lat: -15.79, lng: -47.88 },
  { city: "Curitiba", lat: -25.43, lng: -49.27 },
  { city: "Porto Alegre", lat: -30.03, lng: -51.23 },
  { city: "Salvador", lat: -12.97, lng: -38.5 },
  { city: "Recife", lat: -8.05, lng: -34.88 },
  { city: "Fortaleza", lat: -3.73, lng: -38.52 },
  { city: "Manaus", lat: -3.12, lng: -60.02 },
  { city: "Belém", lat: -1.46, lng: -48.5 },
  { city: "Goiânia", lat: -16.69, lng: -49.26 },
  { city: "Campinas", lat: -22.91, lng: -47.06 },
  { city: "Florianópolis", lat: -27.59, lng: -48.55 },
  { city: "Vitória", lat: -20.32, lng: -40.34 },
  { city: "Natal", lat: -5.79, lng: -35.21 },
  { city: "João Pessoa", lat: -7.12, lng: -34.84 },
  { city: "Maceió", lat: -9.65, lng: -35.74 },
  { city: "Cuiabá", lat: -15.6, lng: -56.1 },
  { city: "Campo Grande", lat: -20.47, lng: -54.62 },
  { city: "São Luís", lat: -2.53, lng: -44.3 },
  { city: "Teresina", lat: -5.09, lng: -42.8 },
  { city: "Londrina", lat: -23.31, lng: -51.16 },
  { city: "Ribeirão Preto", lat: -21.17, lng: -47.81 },
  { city: "Uberlândia", lat: -18.91, lng: -48.27 },
  { city: "Santos", lat: -23.96, lng: -46.33 },
];

const FIRST = [
  "Lucas", "Marina", "Rafael", "Camila", "Pedro", "Júlia", "Bruno", "Aline",
  "Gabriel", "Beatriz", "Thiago", "Larissa", "Felipe", "Carla", "Diego", "Mariana",
  "Vinícius", "Fernanda", "Gustavo", "Patrícia", "Rodrigo", "Amanda", "Leandro", "Sofia",
];

const LAST = [
  "Almeida", "Costa", "Souza", "Lima", "Henrique", "Fernandes", "Carvalho", "Rocha",
  "Oliveira", "Santos", "Pereira", "Ribeiro", "Gomes", "Martins", "Araújo", "Barbosa",
  "Mendes", "Cardoso", "Teixeira", "Moreira", "Nunes", "Cavalcanti", "Dias", "Freitas",
];

// LCG simples e determinístico (sem Math.random/Date) — gera ruído reproduzível.
function rng(seed: number): number {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

// Pool de nomes reais de jogadores (todas as seleções), sem repetição.
const PLAYER_POOL: string[] = (() => {
  const seen = new Set<string>();
  const pool: string[] = [];
  for (const s of squads) {
    for (const p of s.players) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        pool.push(p.name);
      }
    }
  }
  return pool;
})();

const TRADER_COUNT = 48;

export const traders: Trader[] = Array.from({ length: TRADER_COUNT }, (_, i) => {
  const place = CITIES[i % CITIES.length];
  const first = FIRST[(i * 5) % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];

  const hasCount = 3 + (i % 3); // 3 a 5 figurinhas para trocar
  const wantsCount = 2 + (i % 2); // 2 a 3 procuradas
  const pool = PLAYER_POOL.length;

  const has: string[] = [];
  for (let k = 0; pool && has.length < hasCount; k++) {
    const name = PLAYER_POOL[(i * 13 + k * 29) % pool];
    if (!has.includes(name)) has.push(name);
  }
  const wants: string[] = [];
  for (let k = 0; pool && wants.length < wantsCount; k++) {
    const name = PLAYER_POOL[(i * 17 + k * 41 + 7) % pool];
    if (!wants.includes(name) && !has.includes(name)) wants.push(name);
  }

  return {
    id: i + 1,
    name: `${first} ${last}`,
    city: place.city,
    distance: "—",
    rating: Math.round((4.3 + rng(i + 1) * 0.6) * 10) / 10,
    has,
    wants,
    // pequena dispersão em volta da cidade para os pinos não se sobreporem
    lat: place.lat + (rng(i * 3 + 1) - 0.5) * 0.5,
    lng: place.lng + (rng(i * 3 + 2) - 0.5) * 0.5,
    avatar: `${first[0]}${last[0]}`,
  };
});
