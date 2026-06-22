import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Check, Ban } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTrades } from "@/lib/trades-context";
import { chatId, listenMessages, sendMessage, type ChatMessage } from "@/lib/chat";
import { Avatar } from "@/components/Avatar";

export function ChatDrawer() {
  const { user } = useAuth();
  const { chatTarget, closeChat, requests, accept, decline } = useTrades();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const cid = user && chatTarget ? chatId(user.uid, chatTarget.uid) : null;

  // Pedido de troca entre nós dois (para refletir aceitar/cancelar feito no chat).
  const linked = chatTarget ? requests.find((r) => r.participants?.includes(chatTarget.uid)) : undefined;

  async function confirmTrade() {
    if (!cid || !user) return;
    await sendMessage(cid, { from: user.uid, fromName: user.name, text: "✅ Fechado! Troca combinada por aqui." });
    if (linked && linked.status === "pending") accept(linked.id);
  }

  async function cancelTrade() {
    if (!cid || !user) return;
    await sendMessage(cid, { from: user.uid, fromName: user.name, text: "❌ Vou ter que cancelar essa troca, foi mal." });
    if (linked && linked.status === "pending") decline(linked.id);
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
    if (!t || !cid || !user) return;
    setText("");
    await sendMessage(cid, { from: user.uid, fromName: user.name, text: t });
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
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                          mine ? "rounded-br-md bg-[color:var(--fifa-green)] text-white" : "rounded-bl-md bg-card text-card-foreground"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Ações de troca */}
            <div className="flex gap-2 border-t border-border bg-background px-3 pt-3">
              <button
                type="button"
                onClick={confirmTrade}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]"
              >
                <Check className="h-4 w-4" /> Troca feita
              </button>
              <button
                type="button"
                onClick={cancelTrade}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10"
              >
                <Ban className="h-4 w-4" /> Cancelar troca
              </button>
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
