import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Check, Ban, Truck, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTrades } from "@/lib/trades-context";
import { chatId, listenMessages, sendMessage, type ChatMessage } from "@/lib/chat";
import { Avatar } from "@/components/Avatar";

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

export function ChatDrawer() {
  const { user } = useAuth();
  const { chatTarget, closeChat, requests, confirm, decline } = useTrades();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [showDelivery, setShowDelivery] = useState(false);
  const [method, setMethod] = useState<"presencial" | "correios" | "transportadora">("presencial");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const cid = user && chatTarget ? chatId(user.uid, chatTarget.uid) : null;

  // Pedido de troca entre nós dois (para refletir aceitar/cancelar feito no chat).
  const linked = chatTarget ? requests.find((r) => r.participants?.includes(chatTarget.uid)) : undefined;

  const iConfirmed = !!(linked && user && (linked.confirms ?? []).includes(user.uid));

  async function cancelTrade() {
    if (!cid || !user || !chatTarget) return;
    await sendMessage(cid, { from: user.uid, fromName: user.name, to: chatTarget.uid, toName: chatTarget.name, text: "❌ Vou ter que cancelar essa troca, foi mal." });
    if (linked && linked.status === "pending") decline(linked.id);
  }

  // Confirmar entrega no chat = meu "OK" na troca (vira aceita quando os dois confirmam).
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

            {/* Mensagens */}
            <div className="flex-1 space-y-2 overflow-auto bg-muted/40 px-4 py-4">
              {messages.length === 0 ? (
                <div className="mt-10 text-center text-sm text-muted-foreground">
                  Diga oi para {chatTarget.name.split(" ")[0]} e combine as figurinhas. 👋
                </div>
              ) : (
                messages.map((m) => {
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

            {/* Ações de troca + entrega */}
            <div className="space-y-2 border-t border-border bg-background px-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDelivery((v) => !v)}
                disabled={iConfirmed}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all disabled:cursor-default disabled:opacity-70 ${
                  iConfirmed
                    ? "border-[color:var(--fifa-green)]/40 text-[color:var(--fifa-green)]"
                    : showDelivery
                      ? "border-[color:var(--fifa-green)] text-[color:var(--fifa-green)]"
                      : "border-border text-foreground hover:bg-muted"
                }`}
              >
                {iConfirmed ? <Check className="h-4 w-4" /> : <Truck className="h-4 w-4" />} {iConfirmed ? "Você já confirmou a entrega" : "Confirmar entrega"}
              </button>

              {showDelivery && !iConfirmed && (
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
                        className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                          method === key ? "bg-[color:var(--fifa-green)] text-white" : "border border-border bg-card hover:border-[color:var(--fifa-green)]"
                        }`}
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

              {linked?.status === "accepted" ? (
                <div className="flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)]/10 px-3 py-2 text-sm font-bold text-[color:var(--fifa-green)]">
                  <Check className="h-4 w-4" /> Troca concluída pelos dois!
                </div>
              ) : linked?.status === "pending" ? (
                <div className="flex items-center gap-2">
                  {iConfirmed && (
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-[color:var(--fifa-green)]" /> Aguardando o outro confirmar
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={cancelTrade}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 ${iConfirmed ? "" : "w-full"}`}
                  >
                    <Ban className="h-4 w-4" /> Cancelar troca
                  </button>
                </div>
              ) : null}
            </div>

            {/* Caixa de envio */}
            <form onSubmit={submit} className="flex items-center gap-2 bg-background px-3 py-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Mensagem para ${chatTarget.name.split(" ")[0]}…`}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
