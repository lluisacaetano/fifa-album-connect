# Fluxo de troca com negociação (spec p/ implementação)

> Spec da Luísa, organizada pelo Claude. Quem implementar (a outra IA) deve seguir isto.
> NÃO é só visual — é máquina de estados + dados + UI. Mantém o design FIFA já usado.

## Resumo em uma frase
A pessoa A escolhe o que quer de B → B faz uma contraproposta do que quer em troca →
os dois vão **aceitando/recusando** rodadas até **consenso** → tudo fica **registrado no chat** →
se as **quantidades não baterem**, abre o **modal de valor** pra acertar a diferença.

---

## 1. Máquina de estados da troca (`tradeRequests/{id}`)

```
proposta_enviada   → A propôs o que quer de B (round 0). Aguarda B.
contraproposta     → B respondeu com o que quer de A. Aguarda A.   (alterna A↔B a cada rodada)
acordo_quantidade  → os dois concordaram nos itens, MAS as quantidades diferem → precisa de valor
acordada           → consenso total (itens batendo, ou valor definido). Vai p/ entrega/confirmação.
recusada           → alguém encerrou a negociação.
```

Reaproveita o que já existe (`status`, `confirms`, `delivery`, `agreedBy`). A "negociação" acontece
ANTES do estado `accepted` (entrega). Sugestão: `status` ganha `"negotiating"` e o consenso vira `"accepted"`.

## 2. Dados (Firestore)

```ts
type Offer = {
  by: string;            // uid de quem fez esta rodada
  wants: TradeItem[];    // o que QUEM FEZ a rodada quer receber
  createdAt: Timestamp;
};

type TradeRequest = {
  // ...campos atuais...
  rounds: Offer[];       // histórico de propostas/contrapropostas (cresce a cada rodada)
  turn: string;          // uid de quem deve responder agora
  value?: {              // só quando quantidades não batem
    amount: number;      // R$ acertado
    payer: string;       // uid de quem paga (o que recebe MAIS figurinhas)
    agreedBy: string[];  // os dois precisam concordar com o valor
  };
};
```

A "oferta atual de cada lado" é derivada de `rounds`: o último `Offer` de A e o último de B.

## 3. Passo a passo (UI)

### Passo 1 — A monta o pedido (modal "Solicitar troca", reaproveitar o atual)
- Mostra as figurinhas de B (que A precisa). A **seleciona quais quer** (NADA pré-marcado — toque pra escolher; exige ≥1).
- A **NÃO** escolhe o que oferece aqui (isso é a contraproposta de B). Botão: **"Enviar proposta"**.
- Mensagem opcional. → cria a troca, `rounds=[{by:A, wants:selecionadas}]`, `turn=B`.
- No chat aparece: *"📤 A quer: Vini · BRA10, Rodrygo · BRA15"*.

### Passo 2 — B responde (contraproposta)
- B vê no painel/chat "Em negociação" com o que A quer.
- B abre **"Responder proposta"**: vê as figurinhas de A (repetidas de A) e **seleciona o que quer em troca**.
- Botões: **"Enviar contraproposta"** · **"Aceitar como está"** · **"Recusar"**.
- Ao enviar contraproposta: adiciona `{by:B, wants:selecionadas}` a `rounds`, `turn=A`.
- No chat: *"🔁 B quer em troca: Alisson · BRA2"*.

### Passo 3 — Vai e volta até consenso
- A cada rodada, o outro pode **Aceitar**, **Recusar**, ou **Mandar nova contraproposta** (ajusta os itens).
- **Aceitar** = concordou com a última oferta do outro → checa quantidades (passo 4).
- **Recusar** = `status: recusada` (encerra). No chat: *"❌ Fulano recusou."*
- Cada ação vira uma **mensagem no chat** (registro), com um cartãozinho mostrando os itens daquela rodada.

### Passo 4 — Quantidades batem?
- `qtdA = itens que A recebe` · `qtdB = itens que B recebe`.
- **Iguais** → `status: acordada` → segue pro fluxo de **entrega/confirmação** já existente.
- **Diferentes** → abre o **MODAL DE VALOR**:
  - Mostra: *"Você recebe 3, oferece 2 — quer cobrir a diferença?"*
  - Quem recebe MAIS figurinhas é o `payer` (sugestão). Campo: **valor (R$)** + observação.
  - Os DOIS precisam **concordar com o valor** (`value.agreedBy` com os 2 uids) → aí `status: acordada`.
  - Registrado no chat: *"💰 Combinado: R$ 10 — Fulano paga."*

## 4. Registro no chat (importante)
Cada evento de negociação posta uma mensagem na conversa dos dois (mesma coleção `chats/{cid}/messages`),
mas com um tipo especial pra renderizar como **cartão** (não bolha de texto comum):
```ts
type ChatMessage = { ...; kind?: "text" | "offer" | "accept" | "decline" | "value"; offer?: Offer; }
```
Assim o histórico da negociação fica visível e auditável no chat.

---

## 5. Design (FIFA — reaproveitar tokens existentes)
- **Cores:** verde `var(--fifa-green)` (você recebe / aceitar), azul `var(--fifa-blue)` (você dá / contraproposta),
  amarelo `var(--fifa-yellow)` (valor / destaque), `destructive` (recusar). Fundo escuro nos cabeçalhos = `bg-fifa-gradient`.
- **Tipografia:** display Bebas Neue nos títulos dos modais; Inter no corpo.
- **Layout dos modais:** `max-w-3xl`, `max-h-[90dvh]` com **rolagem** (já é padrão); cabeçalho fixo + rodapé fixo com a ação.
  No mobile, empilhar; no desktop, 2 colunas (itens à esquerda, resumo/mensagem à direita).
- **Chips de figurinha:** sempre `Nome · CÓDIGO` (ex.: `Vinícius Júnior · BRA10`). Selecionável = sólido; não-selecionado = contorno + opacity.
- **Cartão de rodada no chat:** mini-lista "Quer: …" / "Oferece: …" + selo de quem propôs + botões contextuais (Aceitar/Recusar/Contrapor) quando for a vez do leitor.
- **Modal de valor (signature):** um "placar" lado a lado — *Você recebe 3 × Você dá 2* — com a diferença destacada em amarelo e o campo de R$. É o elemento memorável da tela.

## 6. Segurança (firestore.rules)
- Só os dois participantes leem/escrevem a troca; `turn` controla quem pode agir (validar no cliente; opcional reforçar na regra).
- `value.agreedBy` só pode crescer com o próprio uid (igual ao `confirms`/`appliedBy`).

## 7. Resumo dos estados pro usuário (copy)
- "Em negociação · sua vez" / "Em negociação · aguardando Fulano"
- "Acordado — combinem a entrega"
- "Precisa acertar o valor (R$)"
- "Recusada"
