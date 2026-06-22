import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Check, Ban, Truck, MapPin, ShieldAlert, Handshake, Repeat, ArrowLeftRight, Clock } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useTrades } from "@/lib/trades-context";
import { chatId, listenMessages, sendMessage, type ChatMessage, type TradeCardMeta } from "@/lib/chat";
import type { TradeAction, TradeItem } from "@/lib/trades";
import { Avatar } from "@/components/Avatar";
import { ValueModal } from "@/components/ValueModal";

const keyOf = (s: TradeItem) => `${s.code}-${s.name}`;
const fmtBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
const NORM_RE = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) => s.normalize("NFD").replace(NORM_RE, "").toLowerCase();
const uniqItems = (arr: TradeItem[]) => {
  const m = new Map<string, TradeItem>();
  for (const s of arr) m.set(keyOf(s), s);
  return [...m.values()];
};
// Transforma URLs do texto (ex.: link de rastreio) em links clicáveis.
function renderText(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="font-semibold underline">
        rastrear ↗
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function ItemChips({ items, tone }: { items: TradeItem[]; tone: "green" | "blue" }) {
  if (!items.length) return <span className="text-[11px] italic text-muted-foreground">nada ainda</span>;
  const cls = tone === "green" ? "bg-[color:var(--fifa-green)]/12 text-[color:var(--fifa-green)]" : "bg-[color:var(--fifa-blue)]/12 text-[color:var(--fifa-blue)]";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={keyOf(s)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
          {s.name}
          {s.code ? <span className="opacity-70"> · {s.code}</span> : null}
        </span>
      ))}
    </div>
  );
}

// Resumo de um deal: "recebe / dá / R$". Lados vazios não aparecem.
function DealRows({ get, give, value }: { get: TradeItem[]; give: TradeItem[]; value?: number }) {
  return (
    <div className="space-y-1.5">
      {get.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="mt-1 w-10 shrink-0 text-[9px] font-bold uppercase tracking-wider text-[color:var(--fifa-green)]">recebe</span>
          <ItemChips items={get} tone="green" />
        </div>
      )}
      {give.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="mt-1 w-10 shrink-0 text-[9px] font-bold uppercase tracking-wider text-[color:var(--fifa-blue)]">dá</span>
          <ItemChips items={give} tone="blue" />
        </div>
      )}
      {!!value && (
        <div className="inline-flex items-center gap-1 rounded-full bg-[color:var(--fifa-yellow)]/30 px-2 py-0.5 text-[11px] font-bold text-[color:var(--fifa-green-deep)]">
          💰 {fmtBRL(value)}
        </div>
      )}
    </div>
  );
}

export function ChatDrawer() {
  const { user } = useAuth();
  const { chatTarget, closeChat, requests, confirm, decline, counter, accept, refuse } = useTrades();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [showDelivery, setShowDelivery] = useState(false);
  const [method, setMethod] = useState<"presencial" | "correios" | "transportadora">("presencial");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  // Negociação
  const [editing, setEditing] = useState(false);
  const [editGet, setEditGet] = useState<Set<string>>(new Set());
  const [editGive, setEditGive] = useState<Set<string>>(new Set());
  const [valueOpen, setValueOpen] = useState(false);
  const [otherPool, setOtherPool] = useState<TradeItem[]>([]);
  const [myPool, setMyPool] = useState<TradeItem[]>([]);
  const [otherWants, setOtherWants] = useState<Set<string>>(new Set());
  const [myWants, setMyWants] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  const cid = user && chatTarget ? chatId(user.uid, chatTarget.uid) : null;

  // Troca entre nós dois: pendente mais recente, depois a concluída.
  const between = chatTarget ? requests.filter((r) => r.participants?.includes(chatTarget.uid)) : [];
  const linked = between.find((r) => r.status === "pending") ?? between.find((r) => r.status === "accepted");

  const iConfirmed = !!(linked && user && (linked.confirms ?? []).includes(user.uid));
  const shipped = Object.values(linked?.delivery ?? {}).some((d) => d.method === "correios" || d.method === "transportadora");
  const canCancel = linked?.status === "pending" && !shipped;

  // Relativo a quem está vendo.
  const iAmFrom = !!(linked && user && linked.fromUid === user.uid);
  const iGet: TradeItem[] = linked ? (iAmFrom ? linked.wanted : linked.offered) : []; // o que EU recebo
  const iGive: TradeItem[] = linked ? (iAmFrom ? linked.offered : linked.wanted) : []; // o que EU dou
  const value = linked?.value ?? 0;
  const agreedBy = linked?.agreedBy ?? [];
  const bothAgreed = agreedBy.length >= 2;
  const myTurn = !!(linked && user && linked.turn === user.uid);
  const otherFirst = chatTarget?.name.split(" ")[0] ?? "";

  // Pools: o que EU recebo = trades do outro; o que EU dou = meus trades.
  // "Quero dele" = repetidas DELE que EU preciso. "Ofereço" = minhas repetidas que ELE precisa.
  // (Mantém sempre os itens da rodada atual para os toggles refletirem o estado.)
  const receivePool = uniqItems([...iGet, ...otherPool.filter((s) => myWants.has(norm(s.name)))]);
  const givePool = uniqItems([...iGive, ...myPool.filter((s) => otherWants.has(norm(s.name)))]);
  const editGetItems = receivePool.filter((s) => editGet.has(keyOf(s)));
  const editGiveItems = givePool.filter((s) => editGive.has(keyOf(s)));

  useEffect(() => {
    if (!user || !chatTarget) {
      setOtherPool([]);
      setMyPool([]);
      setOtherWants(new Set());
      setMyWants(new Set());
      return;
    }
    let alive = true;
    const toItems = (arr: unknown): TradeItem[] =>
      (Array.isArray(arr) ? arr : [])
        .map((t: any) => (typeof t === "string" ? { code: "", name: t } : { code: String(t?.code ?? ""), name: String(t?.name ?? "") }))
        .filter((s: TradeItem) => s.name);
    const toWants = (arr: unknown): Set<string> => new Set((Array.isArray(arr) ? arr : []).map((n: any) => norm(String(n))));
    (async () => {
      try {
        const [oSnap, mSnap] = await Promise.all([getDoc(doc(db, "users", chatTarget.uid)), getDoc(doc(db, "users", user.uid))]);
        if (!alive) return;
        setOtherPool(toItems(oSnap.data()?.trades));
        setMyPool(toItems(mSnap.data()?.trades));
        setOtherWants(toWants(oSnap.data()?.wants));
        setMyWants(toWants(mSnap.data()?.wants));
      } catch {
        /* ignora */
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.uid, chatTarget?.uid]);

  // Sai do modo edição quando a troca muda de rodada/conversa.
  useEffect(() => {
    setEditing(false);
    setValueOpen(false);
  }, [linked?.id, linked?.round, linked?.status]);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    set((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Texto curto só p/ a prévia/notificação (o cartão mostra os detalhes).
  function cardText(action: TradeAction) {
    if (action === "accept") return "✅ Aceitou a troca";
    if (action === "refuse") return "🚫 Recusou a troca";
    if (action === "counter") return "🔁 Nova contraproposta";
    return "📩 Nova proposta de troca";
  }

  async function postCard(action: TradeAction, w: TradeItem[], o: TradeItem[], v?: number) {
    if (!cid || !user || !chatTarget) return;
    const meta: TradeCardMeta = { action, wanted: w, offered: o, by: user.uid, ...(v ? { value: v } : {}) };
    await sendMessage(cid, { from: user.uid, fromName: user.name, to: chatTarget.uid, toName: chatTarget.name, text: cardText(action), kind: "trade", meta });
  }

  function enterEdit() {
    if (!linked) return;
    setEditGet(new Set(iGet.map(keyOf)));
    setEditGive(new Set(iGive.map(keyOf)));
    setEditing(true);
  }

  async function submitCounter(v?: number) {
    if (!linked) return;
    const wanted = iAmFrom ? editGetItems : editGiveItems; // requisitante recebe
    const offered = iAmFrom ? editGiveItems : editGetItems; // requisitante dá
    await counter(linked, { wanted, offered, value: v });
    await postCard("counter", wanted, offered, v);
    setEditing(false);
    setValueOpen(false);
  }

  function trySubmit() {
    if (editGetItems.length === 0 && editGiveItems.length === 0) return;
    if (editGetItems.length !== editGiveItems.length) setValueOpen(true);
    else submitCounter(undefined);
  }

  async function doAccept() {
    if (!linked) return;
    await accept(linked);
    await postCard("accept", linked.wanted, linked.offered, linked.value);
  }
  async function doRefuse() {
    if (!linked) return;
    await refuse(linked);
    await postCard("refuse", linked.wanted, linked.offered, linked.value);
  }

  async function cancelTrade() {
    if (!cid || !user || !chatTarget) return;
    await sendMessage(cid, { from: user.uid, fromName: user.name, to: chatTarget.uid, toName: chatTarget.name, text: "❌ Vou ter que cancelar essa troca, foi mal." });
    if (linked && linked.status === "pending") decline(linked.id);
  }

  // Confirmar entrega no chat = meu "OK" na entrega (vira aceita quando os dois confirmam).
  async function sendDelivery() {
    if (!cid || !user || !chatTarget) return;
    const code = tracking.trim();
    if (method !== "presencial" && !code) return;
    let body = "";
    if (method === "presencial") body = "📍 Combinei entregar pessoalmente.";
    else if (method === "correios") body = `📦 Enviei pelos Correios. Rastreio: ${code}\nhttps://rastreamento.correios.com.br/app/index.php?codigo=${encodeURIComponent(code)}`;
    else body = `🚚 Enviei por transportadora${carrier.trim() ? ` (${carrier.trim()})` : ""}. Rastreio: ${code}`;
    await sendMessage(cid, { from: user.uid, fromName: user.name, to: chatTarget.uid, toName: chatTarget.name, text: body });
    if (linked && linked.status === "pending" && !iConfirmed) {
      await confirm(linked, { method, tracking: code || undefined, carrier: carrier.trim() || undefined });
    }
    setShowDelivery(false);
    setTracking("");
    setCarrier("");
  }

  useEffect(() => {
    if (!cid) {
      setMessages([]);
      return;
    }
    return listenMessages(cid, setMessages);
  }, [cid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, chatTarget]);

  useEffect(() => {
    if (!chatTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatTarget, closeChat]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || !cid || !user || !chatTarget) return;
    setText("");
    await sendMessage(cid, { from: user.uid, fromName: user.name, to: chatTarget.uid, toName: chatTarget.name, text: t });
  }

  // Cartão de rodada (relativo a quem vê).
  function TradeCard({ m }: { m: ChatMessage }) {
    const meta = m.meta!;
    const mine = m.from === user!.uid;
    const who = mine ? "Você" : m.fromName.split(" ")[0];

    // Aceitou / Recusou: pílula compacta centralizada.
    if (meta.action === "accept" || meta.action === "refuse") {
      const ok = meta.action === "accept";
      return (
        <div className="flex justify-center py-0.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${ok ? "bg-[color:var(--fifa-green)]/12 text-[color:var(--fifa-green)]" : "bg-destructive/10 text-destructive"}`}>
            {ok ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />} {who} {ok ? "aceitou a troca" : "recusou a troca"}
          </span>
        </div>
      );
    }

    const isCounter = meta.action === "counter";
    return (
      <div className="mx-auto w-full max-w-[86%] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-[color:var(--fifa-green)]/[0.07] px-3 py-1.5">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--fifa-green)]/15 text-[color:var(--fifa-green)]">
            {isCounter ? <Repeat className="h-3.5 w-3.5" /> : <ArrowLeftRight className="h-3.5 w-3.5" />}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--fifa-green-deep)]">
            {who} {isCounter ? "contrapôs" : "propôs"}
          </span>
        </div>
        <div className="px-3 py-2.5">
          <DealRows get={iAmFrom ? meta.wanted : meta.offered} give={iAmFrom ? meta.offered : meta.wanted} value={meta.value} />
        </div>
      </div>
    );
  }

  const dealEmpty = iGet.length === 0 && iGive.length === 0;
  // Só dá pra aceitar quando é justo: contagens iguais (>0) ou há um valor combinado.
  // Senão, a pessoa precisa Responder (escolher o que quer / combinar R$).
  const canAccept = !!value || (iGet.length === iGive.length && iGet.length > 0);

  return (
    <AnimatePresence>
      {chatTarget && user && (
        <motion.div className="fixed inset-0 z-[110]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`Conversa com ${chatTarget.name}`}>
          <button aria-label="Fechar" onClick={closeChat} className="absolute inset-0 cursor-default bg-[color:var(--fifa-night)]/80 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
          >
            {/* Cabeçalho */}
            <div className="group foil-sheen relative flex items-center gap-3 bg-fifa-gradient px-5 py-4 text-white">
              <span className="foil-sheen-layer" aria-hidden />
              <button onClick={closeChat} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/35">
                <X className="h-4 w-4" />
              </button>
              <Avatar name={chatTarget.name} photo={chatTarget.photo} size={40} className="ring-2 ring-white/40" />
              <div>
                <div className="font-display text-xl leading-none">{chatTarget.name}</div>
                <div className="text-[11px] text-white/80">Combine sua troca</div>
              </div>
            </div>

            {/* Aviso de segurança */}
            <div className="flex items-start gap-2 border-b border-border bg-[color:var(--fifa-yellow)]/15 px-4 py-2 text-[11px] leading-snug text-foreground/80">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--fifa-green-deep)]" />
              <span>
                Troque em <strong>locais movimentados</strong> (ex.: em frente a um supermercado ou pontos de troca oficiais). Nunca combine em lugares vazios nem compartilhe sua localização exata com desconhecidos.
              </span>
            </div>

            {/* Mensagens */}
            <div className="flex-1 space-y-2 overflow-auto bg-muted/40 px-4 py-4">
              {messages.length === 0 ? (
                <div className="mt-10 text-center text-sm text-muted-foreground">
                  Diga oi para {otherFirst} e combine as figurinhas. 👋
                </div>
              ) : (
                messages.map((m) => {
                  if (m.kind === "trade" && m.meta) return <TradeCard key={m.id} m={m} />;
                  const mine = m.from === user.uid;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                          mine ? "rounded-br-md bg-[color:var(--fifa-green)] text-white" : "rounded-bl-md bg-card text-card-foreground"
                        }`}
                      >
                        {renderText(m.text)}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Ações de troca */}
            {linked && (
              <div className="space-y-2 border-t border-border bg-background px-3 pt-3">
                {linked.status === "accepted" ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)]/10 px-3 py-2 text-sm font-bold text-[color:var(--fifa-green)]">
                    <Check className="h-4 w-4" /> Troca concluída pelos dois!
                  </div>
                ) : !bothAgreed ? (
                  /* ---------- NEGOCIAÇÃO ---------- */
                  <div className="space-y-2.5 rounded-2xl border border-border bg-muted/40 p-3">
                    {editing ? (
                      /* Editor de contraproposta */
                      <div className="space-y-2.5">
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">Você quer de {otherFirst}</div>
                          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                            {receivePool.length ? (
                              receivePool.map((s) => {
                                const on = editGet.has(keyOf(s));
                                return (
                                  <button key={keyOf(s)} type="button" onClick={() => toggle(setEditGet, keyOf(s))} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${on ? "bg-[color:var(--fifa-green)] text-white" : "border border-[color:var(--fifa-green)]/40 text-[color:var(--fifa-green)] hover:bg-[color:var(--fifa-green)]/10"}`}>
                                    {s.name}
                                    {s.code ? <span className="opacity-80"> · {s.code}</span> : null}
                                  </button>
                                );
                              })
                            ) : (
                              <span className="text-[11px] text-muted-foreground">{otherFirst} não tem figurinhas disponíveis.</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--fifa-blue)]">Você oferece</div>
                          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                            {givePool.length ? (
                              givePool.map((s) => {
                                const on = editGive.has(keyOf(s));
                                return (
                                  <button key={keyOf(s)} type="button" onClick={() => toggle(setEditGive, keyOf(s))} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${on ? "bg-[color:var(--fifa-blue)] text-white" : "border border-[color:var(--fifa-blue)]/40 text-[color:var(--fifa-blue)] hover:bg-[color:var(--fifa-blue)]/10"}`}>
                                    {s.name}
                                    {s.code ? <span className="opacity-70"> · {s.code}</span> : null}
                                  </button>
                                );
                              })
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Você não tem repetidas para oferecer (marque em “Meu Álbum”).</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted">
                            Cancelar
                          </button>
                          <button type="button" onClick={trySubmit} disabled={editGetItems.length === 0 && editGiveItems.length === 0} className="flex-1 rounded-full bg-[color:var(--fifa-green)] px-3 py-2 text-xs font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)] disabled:opacity-50">
                            Enviar contraproposta
                          </button>
                        </div>
                      </div>
                    ) : myTurn ? (
                      /* Minha vez: resumo do deal + ações */
                      <>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">
                          <Handshake className="h-3.5 w-3.5" /> Sua vez — responda
                        </div>
                        <div className="rounded-xl bg-card p-2.5 shadow-sm">
                          <DealRows get={iGet} give={iGive} value={value} />
                        </div>
                        {canAccept ? (
                          <div className="grid grid-cols-3 gap-2">
                            <button type="button" onClick={doAccept} className="inline-flex items-center justify-center gap-1 rounded-full bg-[color:var(--fifa-green)] px-2 py-2.5 text-xs font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
                              <Check className="h-3.5 w-3.5" /> Aceitar
                            </button>
                            <button type="button" onClick={enterEdit} className="inline-flex items-center justify-center gap-1 rounded-full border border-[color:var(--fifa-green)] px-2 py-2.5 text-xs font-bold text-[color:var(--fifa-green)] transition-all hover:bg-[color:var(--fifa-green)]/10">
                              <Repeat className="h-3.5 w-3.5" /> Contrapor
                            </button>
                            <button type="button" onClick={doRefuse} className="inline-flex items-center justify-center gap-1 rounded-full border border-destructive/40 px-2 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/10">
                              <Ban className="h-3.5 w-3.5" /> Recusar
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] leading-snug text-muted-foreground">Escolha o que você quer em troca (ou combine um valor) antes de fechar.</p>
                            <div className="grid grid-cols-3 gap-2">
                              <button type="button" onClick={enterEdit} className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)] px-2 py-2.5 text-xs font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
                                <Repeat className="h-3.5 w-3.5" /> Responder proposta
                              </button>
                              <button type="button" onClick={doRefuse} className="inline-flex items-center justify-center gap-1 rounded-full border border-destructive/40 px-2 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/10">
                                <Ban className="h-3.5 w-3.5" /> Recusar
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      /* Aguardando o outro — enxuto, sem repetir o deal (já está no cartão acima) */
                      <div className="flex items-center gap-2">
                        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-muted px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> Aguardando {otherFirst} responder
                        </span>
                        <button type="button" onClick={doRefuse} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2.5 text-xs font-semibold text-destructive transition-all hover:bg-destructive/10">
                          <Ban className="h-3.5 w-3.5" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ) : iConfirmed ? (
                  <div className="flex items-center gap-2">
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)]/10 px-3 py-2 text-xs font-semibold text-[color:var(--fifa-green)]">
                      <Check className="h-3.5 w-3.5" /> Você confirmou — aguardando o outro
                    </span>
                    {canCancel && (
                      <button type="button" onClick={cancelTrade} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10">
                        <Ban className="h-4 w-4" /> Cancelar
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {!!value && (
                      <div className="flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)]/10 px-3 py-1.5 text-xs font-bold text-[color:var(--fifa-green-deep)]">
                        Acordo fechado · 💰 {fmtBRL(value)} combinado
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDelivery((v) => !v)}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                        showDelivery ? "border-[color:var(--fifa-green)] text-[color:var(--fifa-green)]" : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <Truck className="h-4 w-4" /> Confirmar entrega
                    </button>

                    {showDelivery && (
                      <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-3">
                        <div className="grid grid-cols-3 gap-1.5">
                          {([
                            ["presencial", "Pessoal"],
                            ["correios", "Correios"],
                            ["transportadora", "Transp."],
                          ] as const).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setMethod(key)}
                              className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${method === key ? "bg-[color:var(--fifa-green)] text-white" : "border border-border bg-card hover:border-[color:var(--fifa-green)]"}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {method === "transportadora" && (
                          <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Transportadora (ex.: Jadlog)" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-[color:var(--fifa-green)] focus:ring-2" />
                        )}
                        {method !== "presencial" && (
                          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Código de rastreio" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-[color:var(--fifa-green)] focus:ring-2" />
                        )}
                        <button
                          type="button"
                          onClick={sendDelivery}
                          disabled={method !== "presencial" && !tracking.trim()}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)] disabled:opacity-50"
                        >
                          {method === "presencial" ? <MapPin className="h-4 w-4" /> : <Truck className="h-4 w-4" />} Confirmar minha entrega
                        </button>
                      </div>
                    )}

                    {canCancel ? (
                      <button type="button" onClick={cancelTrade} className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10">
                        <Ban className="h-4 w-4" /> Cancelar troca
                      </button>
                    ) : (
                      <p className="text-center text-[11px] text-muted-foreground">Já enviado pelos Correios/transportadora — não dá mais para cancelar.</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Caixa de envio */}
            <form onSubmit={submit} className="flex items-center gap-2 bg-background px-3 py-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Mensagem para ${otherFirst}…`}
                className="h-11 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                aria-label="Enviar"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--fifa-green)] text-white transition-all hover:bg-[color:var(--fifa-green-deep)] disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.aside>

          <ValueModal open={valueOpen} receiveCount={editGetItems.length} giveCount={editGiveItems.length} initial={value} onCancel={() => setValueOpen(false)} onConfirm={(v) => submitCounter(v)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
