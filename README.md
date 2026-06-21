# ⚽ Álbum FIFA 2026

Rede social e álbum digital de figurinhas da **Copa do Mundo FIFA 2026** (Canadá · México · EUA). Colecione, troque e complete seu álbum, conheça os jogadores das 48 seleções, acompanhe a fase de grupos e as partidas.

## ✨ Funcionalidades

- **Jogadores** — elencos reais das 48 seleções: foto, posição, número, clube, idade e estatísticas, com seletor de seleção e carrossel um a um.
- **Meu Álbum** — marque as figurinhas que você tem, busque por jogador ou seleção e acompanhe o progresso.
- **Grupos** — as 12 tabelas da fase de grupos.
- **Partidas** — calendário de jogos e estádios.
- **Conectar** — seção social para trocas entre colecionadores.

## 🧱 Stack

- [TanStack Start](https://tanstack.com/start) (React + SSR) e [TanStack Router](https://tanstack.com/router)
- [Vite](https://vitejs.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + componentes [shadcn/ui](https://ui.shadcn.com/) (Radix)
- [Framer Motion](https://www.framer.com/motion/) / GSAP para animações
- [Leaflet](https://leafletjs.com/) para o mapa dos estádios
- Fontes: Bebas Neue (display) + Inter

## 🚀 Rodando localmente

```bash
bun install      # ou: npm install
bun run dev      # sobe em http://localhost:8080
```

Scripts:

| Comando | O que faz |
|---|---|
| `bun run dev` | Servidor de desenvolvimento |
| `bun run build` | Build de produção |
| `bun run preview` | Pré-visualiza o build |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |

## 🗂️ Dados dos jogadores

Os dados das seleções são **buscados uma vez** e gravados em `src/data/` (como os elencos não mudam, o JSON funciona como "banco" estático — sem servidor/DB em runtime).

| Arquivo | Conteúdo |
|---|---|
| `src/data/worldcup.json` | 48 seleções, grupos, estádios e partidas |
| `src/data/nations.ts` | Metadados das seleções (código de bandeira, cores) |
| `src/data/squads.generated.json` | Elencos completos gerados pelos scripts |
| `src/data/players.ts` | Elenco curado do Brasil (fotos locais) |
| `src/data/squads.ts` | Junta tudo num formato único (ordena por número da camisa) |

### Scripts de coleta (`scripts/`)

Resumíveis e com _throttle_ (respeitam os limites das APIs gratuitas):

- `fetch-squads.mjs` — baixa os 48 elencos da [API-Football](https://www.api-football.com/) (`/players/squads`): nome, posição, número, idade, foto.
- `fetch-photos.mjs` — substitui as fotos por **cutouts hi-res** (PNG transparente) da [TheSportsDB](https://www.thesportsdb.com/), casando por nome + nacionalidade; também traz o clube. Sem match confiável, mantém a foto da API.
- `enrich-stats.mjs` — adiciona estatísticas da temporada (gols, assistências, jogos) via API-Football.

```bash
# requer uma key gratuita da API-Football
APIFOOTBALL_KEY=xxxx node scripts/fetch-squads.mjs
node scripts/fetch-photos.mjs
APIFOOTBALL_KEY=xxxx node scripts/enrich-stats.mjs
```

> ⚠️ O plano gratuito da API-Football tem limite de **100 requisições/dia** e **10/minuto** — por isso os scripts rodam em levas e são resumíveis (cache em `/tmp/apif`).

## 📁 Estrutura

```
src/
├── components/      # Hero, Navbar, PlayersCarousel, AlbumSection, GruposSection, ...
│   └── ui/          # componentes shadcn/ui
├── data/            # dados das seleções, jogadores e partidas
├── routes/          # rotas do TanStack Router
└── styles.css       # tema e tokens (cores FIFA)
scripts/             # coleta de dados das APIs
public/              # favicon, fotos locais
```

---

Projeto acadêmico — não afiliado à FIFA.
