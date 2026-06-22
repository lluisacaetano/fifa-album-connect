# ⚽ Álbum FIFA 2026

Rede social e álbum digital de figurinhas da **Copa do Mundo FIFA 2026** (Canadá · México · EUA). Colecione as figurinhas das 48 seleções, **troque com colecionadores perto de você** num mapa em tempo real, **dê palpites** nos jogos e dispute o ranking. Funciona em **web (desktop/tablet) e mobile**.

> 🔗 **App no ar (Vercel):** https://fifa-album.vercel.app · **Preview (Lovable):** https://fifa-album-connect.lovable.app

Projeto acadêmico da disciplina de **Inteligência Artificial** — desenvolvido com ferramentas de IA (**Lovable** + **Claude Code**). Não afiliado à FIFA.

---

## ✨ Funcionalidades principais

1. **Meu Álbum** — marque as figurinhas que você tem (clique soma: tenho → repetida); 2+ vira automaticamente "para troca". Busca por jogador/seleção/nº (ex.: `BRA10`), progresso por seleção e geral, conquistas, e **sincronização entre dispositivos** (Firebase). Exige login.
2. **Trocas (mapa social)** — colecionadores reais aparecem no **mapa** (Leaflet) como mini-figurinhas; filtre por seleção e distância; **solicite troca**, **converse no chat em tempo real**, combine a **entrega** (presencial / Correios / transportadora com **código de rastreio**), e **avalie** quem você trocou (reputação).
3. **Palpites** — dentro de **Partidas**, clique num jogo, **crave o placar** (até 1h antes), veja o **gráfico** com a distribuição dos palpites da galera e o **ranking** de quem mais acerta. Notifica quando você acerta o placar.

Outras: login por **e-mail/senha** e **Google**, recuperação de senha, **perfil com foto**, **notificações** (sino) e **caixa de mensagens**, jogadores das 48 seleções (carrossel com swipe no mobile), grupos e calendário de partidas com **placares ao vivo** (ESPN).

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19 + **SSR**) + [TanStack Router](https://tanstack.com/router) |
| Build | [Vite](https://vitejs.dev/) + TypeScript · [Nitro](https://nitro.build/) (SSR; preset Vercel/Cloudflare) |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com/) + componentes [shadcn/ui](https://ui.shadcn.com/) (Radix) |
| Animação | [Framer Motion](https://www.framer.com/motion/) |
| Mapa | [Leaflet](https://leafletjs.com/) + react-leaflet (tiles OpenStreetMap) |
| Backend (BaaS) | **Firebase** — Authentication + Cloud Firestore (tempo real) |
| Toasts | [sonner](https://sonner.emilkowal.ski/) |
| Dados / placares | JSON estático das seleções + API **ESPN** (placares ao vivo) + **IBGE** (cidades) |
| Fontes | Bebas Neue (display) + Inter |

---

## 🚀 Rodando localmente

Pré-requisito: **Node 18+** (ou Bun).

```bash
npm install
npm run dev        # sobe em http://localhost:8080
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (HMR) |
| `npm run build` | Build de produção |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

> A configuração do Firebase (app **web**, que é pública por design) já vem **embutida** em `src/lib/firebase.ts` com fallback — então o app **roda sem `.env`**. Para apontar para outro projeto, crie um `.env.local` com as `VITE_FIREBASE_*`.

---

## 🔥 Configuração do Firebase (para o backend funcionar)

O app usa um projeto Firebase (`fifa-album-connect`). Para subir o seu:

1. **Authentication → Sign-in method:** ative **E-mail/senha** e **Google**. Em *Settings → Authorized domains*, adicione o domínio do deploy (ex.: `seu-app.vercel.app`).
2. **Firestore Database:** crie em `southamerica-east1`.
3. **Regras:** publique o conteúdo de [`firestore.rules`](./firestore.rules) (perfis com leitura pública para o mapa, e escrita só do dono; trocas/chat só entre os participantes; palpites públicos para leitura).

Coleções usadas: `users`, `tradeRequests`, `chats/{cid}/messages`, `predictions`.

---

## 🌐 Deploy

- **Vercel:** o build do Nitro está configurado para o preset Vercel (`vite.config.ts` → `nitro: { preset: "vercel" }`), gerando `.vercel/output`. A Vercel detecta e serve automaticamente. _Build Command:_ `npm run build`.
- **Lovable:** publica pelo botão **Publish** (não atualiza sozinho no push).

---

## ✅ Como testar

1. Crie uma conta (e-mail/senha forte ou Google) e informe a cidade.
2. Em **Meu Álbum**, marque figurinhas; deixe 2+ em algumas (vira "para troca").
3. Em **Trocas**, você aparece no mapa. Em uma **2ª conta** (aba anônima), crie outro colecionador e teste: **solicitar troca → chat → confirmar entrega → avaliar**.
4. Em **Partidas**, clique num jogo e **dê um palpite**; veja o gráfico e o ranking.

---

## 🗂️ Dados dos jogadores e fontes

Os dados das seleções são **coletados uma vez** por scripts (`scripts/`) e gravados em `src/data/` — como os elencos não mudam, o JSON funciona como "banco" estático (sem servidor/DB em runtime para isso).

### Fontes (e estratégia de _fallback_)
Como cada API gratuita tem **limites** e nem sempre tem tudo, a coleta combina **várias fontes** — quando uma não tinha a informação/imagem **ou** a cota estourava, caímos para outra:

| Dado | Fonte principal | Fallback / complemento |
|---|---|---|
| **Elenco** (nome, posição, número, idade) | **API-Football** (`fetch-squads.mjs`, `fetch-fullnames.mjs`) | — |
| **Estatísticas** (jogos, gols, assistências) | **Dataset do Kaggle** `swaptr/fifa-wc-2026-players` → `scripts/fifa-wc-2026-players.csv` (`merge-kaggle.mjs`) | API-Football (`enrich-stats.mjs`) |
| **Foto** do jogador | **TheSportsDB** — _cutouts_ hi-res PNG transparente (`fetch-photos.mjs`) | **foto da API-Football** quando não há match confiável (guardada em `p.photoApi`); fotos **manuais** têm prioridade (`apply-custom-photos.mjs`); remoção de fundo em lote com **rembg** (`rembg_batch.py`) |
| **Descrição / informações** (bio, carreira, valor) | **Wikipédia (PT)** (`enrich-wikipedia.mjs`) | **Wikipédia (EN) traduzida** p/ PT via Google Translate (sem verbete PT); **Transfermarkt** (wrapper público, `enrich-tm.mjs`) |
| **Bandeiras** | flagcdn.com | — |
| **Jogos, partidas e resultados/placares** (em runtime) | API **ESPN** (scoreboard da Copa) | mostra só o horário agendado se indisponível |
| **Cidades / geocodificação** (em runtime) | **IBGE** (lista de cidades) + **Nominatim/OSM** (lat/lng) | capital da UF se o geocoder falhar |

> **Recorte/PNG das figurinhas:** para deixar o jogador recortado com fundo transparente, o pipeline é: `localize-photos.mjs` baixa a melhor foto p/ `public/players/` (`-trim` nos cutouts, marca o resto p/ recorte) → `rembg_batch.py` remove o fundo em lote (modelo **u2net**, carregado 1×) gerando **PNG transparente** → `apply-custom-photos.mjs` sobrepõe fotos manuais **convertendo `.webp`/`.jpg`/`.png` → `.png`** via `sips`. Resultado: imagem final sempre **PNG padronizado**.
>
> **Atualização de jogos/resultados:** o calendário fica em `worldcup.json`, mas **placares e andamento são atualizados em runtime pela API ESPN** (`state`: `pre`/`in`/`post`) — alimentando a lista de **Partidas** (ao vivo/final) e o **ranking de Palpites** (jogos `post` definem o resultado real para pontuar).

Boas práticas dos scripts: **resumíveis** (cache em `/tmp/apif`), com **throttle** (respeitam os limites — ex.: API-Football 100/dia e 10/min), confirmação de **match por nome + nacionalidade/clube** (evita jogador/clube errado), e ajustes oficiais por seleção (`album-<código>.mjs`, ex.: monta o álbum oficial Panini do Brasil e corrige nº de camisas).

### Arquivos de dados
| Arquivo | Conteúdo |
|---|---|
| `src/data/worldcup.json` | 48 seleções, grupos, estádios e partidas |
| `src/data/squads.generated.json` | Elencos completos (gerados pelos scripts) |
| `src/data/squads.ts` / `players.ts` / `nations.ts` | Formato unificado, curadoria e metadados |

---

## 📁 Estrutura

```
src/
├── components/     # Hero, Navbar, AlbumSection, ConnectSection (mapa/trocas),
│                   # MatchesSection (+palpites), ChatDrawer, modais, ui/ (shadcn)
├── lib/            # firebase, auth, trades, trades-context, chat, predictions, profile, sound
├── data/           # seleções, jogadores, partidas
├── routes/         # rotas do TanStack Router (__root, index)
└── styles.css      # tema e tokens (cores FIFA)
firestore.rules     # regras de segurança do Firestore
docs/               # specs (ex.: fluxo de negociação de troca)
scripts/            # coleta de dados das APIs
```

---

## 🤖 Ferramentas de IA usadas

- **Lovable** — scaffold inicial do app web (low-code) e deploy de preview.
- **Claude Code** — desenvolvimento das features complexas (Firebase Auth/Firestore, mapa de trocas, chat em tempo real, palpites, reputação, responsividade, deploy), curadoria de dados e fotos das seleções, debug e refactor.

Detalhes do uso da IA e a documentação descritiva completa estão em [`DOCUMENTACAO.md`](./DOCUMENTACAO.md).
