# Documentação do Projeto — Álbum FIFA 2026

**Disciplina:** Inteligência Artificial — Desenvolvimento de Aplicação com Ferramentas de IA

---

## 1. Título e tema

**Título:** Álbum FIFA 2026 — Colecione, troque e complete

**Tema:** Aplicação web e mobile que é, ao mesmo tempo, um **álbum digital de figurinhas** da Copa do Mundo FIFA 2026 e uma **rede social de trocas** entre colecionadores. O usuário monta seu álbum das 48 seleções, encontra outras pessoas perto de si num mapa, negocia e combina trocas por chat (com entrega e rastreio), avalia com quem trocou e ainda dá **palpites** nos jogos disputando um ranking.

A escolha do tema une um produto cultural conhecido (o álbum de figurinhas da Copa) a funcionalidades sociais e de tempo real, explorando geolocalização, mensageria e gamificação.

---

## 2. Descrição das funcionalidades implementadas

A aplicação tem **mais de 3 funcionalidades principais**. As três centrais:

### 2.1 Meu Álbum (coleção)
- Grade das figurinhas das 48 seleções (escudo, foto da seleção e jogadores).
- **Clique cumulativo:** 1 clique = "tenho"; cliques seguintes contam **repetidas**; a partir de 2, a figurinha entra automaticamente como **"para troca"**.
- Busca por jogador, seleção ou **número da figurinha** (ex.: `BRA10`).
- **Progresso** por seleção e geral, **conquistas** (seleções completas, marcos de %, trocas feitas) e visão **"Para troca"**.
- **Sincronização em nuvem** (Firestore): o álbum é salvo por usuário e volta igual em qualquer dispositivo.
- Acesso exige login.

### 2.2 Trocas (rede social com mapa)
- **Mapa interativo** (Leaflet/OpenStreetMap) onde cada colecionador real aparece como uma **mini-figurinha**; pino com badge de quantidade.
- **Filtros** por seleção e por **raio de distância**; busca por código/nome.
- A cidade do usuário é **geocodificada** (IBGE/Nominatim) para posicioná-lo no mapa.
- **Solicitar troca**, **chat em tempo real** entre os dois, **aviso de segurança** (trocar em locais movimentados).
- **Entrega:** presencial, **Correios** ou **transportadora**, com **código de rastreio** (link clicável para os Correios). A troca só fecha quando **os dois confirmam**.
- **Reputação:** após a troca concluída, cada um avalia o outro (1–5 ⭐); a média aparece no card.
- Notificações (sino) e **caixa de mensagens** com todas as conversas.

### 2.3 Palpites e ranking
- Dentro de **Partidas**, cada jogo abre um painel para **cravar o placar** (válido até **1 hora antes** do jogo).
- **Gráfico de barras** com a distribuição dos palpites de todos os usuários; destaque do resultado real e do seu palpite.
- **Ranking** dos melhores palpiteiros (placar exato = 3 pts, acerto do vencedor/empate = 1 pt), usando resultados reais via API ESPN.
- **Notificação** (toast) quando o seu palpite bate o placar final.

### Funcionalidades de apoio
Login por **e-mail/senha** (com senha forte e confirmação) e **Google**; **recuperação de senha**; **perfil com foto** (redimensionada no cliente e salva no banco); jogadores das 48 seleções (carrossel com **swipe** no mobile); grupos da fase de grupos; calendário de partidas com **placares ao vivo** (ESPN); tela de carregamento com a logo; responsividade web/mobile.

---

## 3. Arquitetura técnica da solução

### 3.1 Visão geral
Aplicação **single-page com renderização no servidor (SSR)** em React, servida por TanStack Start/Nitro, com **Firebase** como backend-as-a-service (autenticação + banco em tempo real). Não há servidor próprio: a lógica roda no cliente e o estado compartilhado vive no Firestore, com **listeners em tempo real**.

```
┌─────────────────────────────────────────────┐
│  Navegador / Mobile (web responsiva)         │
│  React 19 + TanStack Router (SSR via Nitro)  │
│  Tailwind v4 · Framer Motion · Leaflet        │
└───────────────┬─────────────────────────────┘
                │  SDK Firebase (tempo real)
        ┌───────┴────────────────────┐
        │  Firebase                   │
        │  • Authentication (e-mail/Google)
        │  • Cloud Firestore (users, tradeRequests, chats, predictions)
        └─────────────────────────────┘
        APIs externas: ESPN (placares) · IBGE/Nominatim (cidades/geocode)
        Dados estáticos: src/data/*.json (elencos das seleções)
```

### 3.2 Camadas
- **UI (`src/components/`)** — seções da página (Álbum, Trocas, Partidas/Palpites, Jogadores), modais (login, perfil, troca), chat, mapa, e biblioteca shadcn/ui (Radix).
- **Domínio (`src/lib/`)** — `auth` (contexto de autenticação), `trades` + `trades-context` (pedidos de troca), `chat` (mensagens), `predictions` (palpites), `profile` (perfil/geocode/distância), `firebase` (init), `sound`.
- **Dados (`src/data/`)** — JSON estático das 48 seleções, grupos, estádios e partidas.
- **Rotas (`src/routes/`)** — `__root` (providers, head, splash) e `index` (página única com as seções).

### 3.3 Modelo de dados (Firestore)
- `users/{uid}` — nome, cidade, lat/lng, foto, **álbum** (por número), figurinhas **para troca** e **procuradas**, reputação (`ratingSum`/`ratingCount`). E-mail **não** é gravado aqui (fica só no Auth, por privacidade).
- `tradeRequests/{id}` — participantes, itens (com número+nome), status, confirmações de entrega, avaliações.
- `chats/{cid}/messages/{id}` — mensagens (sala = par de uids).
- `predictions/{matchId_uid}` — palpite de placar por jogo/usuário.

### 3.4 Segurança
Regras do Firestore (`firestore.rules`): perfis com **leitura pública** (necessário para o mapa) mas **escrita só do dono**; trocas e chat **restritos aos dois participantes**; avaliação só pode somar `ratingSum`/`ratingCount`; palpites com leitura pública e escrita só do autor.

### 3.5 Build e deploy
Vite + Nitro (preset **Vercel** → `.vercel/output`). Deploy na **Vercel** (atualiza no push) e preview na **Lovable** (publish manual).

---

## 4. Como a ferramenta de IA foi utilizada no projeto

O projeto foi desenvolvido **majoritariamente com ferramentas de IA**, do scaffold ao deploy:

- **Lovable (low-code com IA)** — gerou o **scaffold inicial** do app web (estrutura React/TanStack, tema FIFA, seções base) e o ambiente de **preview**. Ponto de partida rápido do MVP.
- **Claude Code (IA generativa via CLI)** — responsável pelo **desenvolvimento das funcionalidades complexas** e por todo o raciocínio de engenharia:
  - Integração com **Firebase** (Auth e-mail/Google, Firestore, regras de segurança).
  - **Mapa de trocas** (Leaflet), **chat em tempo real**, **reputação**, fluxo de **entrega/rastreio**.
  - **Palpites** com gráfico, prazo e **ranking** (integração com a API ESPN).
  - **Geocodificação** das cidades (IBGE/Nominatim) e cálculo de distância.
  - **Responsividade** web/mobile, correções de UX, e **deploy** (configuração do Nitro para a Vercel).
  - **Debug e refactor** (ex.: correção de bug de hidratação, vazamento de e-mail público, etc.).
  - Geração da **documentação** (este arquivo, README e a spec de negociação em `docs/`).
- **Claude Code (segunda instância, em paralelo)** — usada simultaneamente para **curadoria de dados e fotos** das seleções (pipelines de coleta). Ou seja, o **Claude Code foi usado em duas instâncias ao mesmo tempo**, cada uma cuidando de uma frente do projeto.

**Prompt engineering:** o desenvolvimento foi guiado por instruções em linguagem natural (descrição de funcionalidades, ajustes de UI por captura de tela, correções pontuais), com a IA propondo a implementação, explicando trade-offs e iterando a partir do feedback — incluindo o uso de uma "skill" de design de frontend para decisões visuais.

---

## 5. Instruções de uso da aplicação

1. **Entrar:** clique em **Entrar** e crie uma conta (e-mail + senha forte, ou Google). Informe sua **cidade** (autocompletar do IBGE).
2. **Montar o álbum:** vá em **Meu Álbum**, escolha a seleção e **clique** nas figurinhas que você tem. Clique de novo para marcar **repetidas** (2+ vira "para troca").
3. **Trocar:** em **Trocas**, você aparece no mapa. Clique no pino de outro colecionador → **Solicitar troca** ou **Conversar**. Combine a entrega (presencial/Correios/transportadora) e, ao concluir, **avalie** a pessoa.
4. **Palpitar:** em **Partidas**, clique num jogo e **crave o placar** (até 1h antes). Veja o **gráfico** e, na aba **Ranking**, quem mais acerta.
5. **Notificações:** o **sino** mostra pedidos e status; o ícone de **mensagens** abre suas conversas.

A versão **mobile** tem o mesmo conjunto de funcionalidades (menu adaptado, swipe nos jogadores, modais com rolagem).

---

## 6. Links

- **Aplicação (Vercel):** `https://fifa-album.vercel.app`  _(confirmar URL final)_
- **Preview (Lovable):** `https://fifa-album-connect.lovable.app`
- **Repositórios (GitHub):**
  - `https://github.com/luisacaetano/fifa-album-connect`
  - `https://github.com/lluisacaetano/fifa-album-connect`
  - `https://github.com/yasmimffaria/fifa-album-connect`

---

## 7. Integrantes do grupo

| Nome | GitHub |
|---|---|
| Luísa Caetano | `@luisacaetano` / `@lluisacaetano` |
| Yasmim Stefane Faria | `@yasmimffaria` |
| _(adicionar demais integrantes, se houver)_ | |

> ⚠️ Preencha/ajuste os nomes completos e usuários conforme o grupo.

---

## 8. Mapeamento aos critérios de avaliação

| Critério | Como o projeto atende |
|---|---|
| **Funcionalidade (25%)** | App completo e funcional em **web e mobile**, com 3+ funcionalidades (álbum, trocas com chat, palpites) testadas com contas reais. |
| **Uso da ferramenta de IA (25%)** | Desenvolvimento de ponta a ponta com **Lovable + Claude Code** (este em **duas instâncias paralelas**): geração de código, integração de backend, debug, refactor e deploy. |
| **Qualidade do código (20%)** | TypeScript tipado, organização por **componentes/lib/data/routes**, comentários, ESLint/Prettier, regras de segurança no banco. |
| **Documentação (15%)** | Este documento + **README.md** (como rodar/testar/deploy) + spec técnica em `docs/`. |
| **Criatividade e inovação (15%)** | Mapa de trocas com **pino-figurinha**, fluxo de **entrega com rastreio**, **reputação**, **palpites com ranking** e tempo real. |
