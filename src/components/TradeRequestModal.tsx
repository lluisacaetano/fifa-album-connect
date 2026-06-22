import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeftRight, Check, Repeat, Sparkles } from "lucide-react";
import type { Trader } from "@/data/traders";
import type { TradeItem } from "@/lib/trades";

type Props = {
  target: Trader | null;
  wanted: TradeItem[]; // figurinhas dele que eu preciso (número + nome)
  offered: TradeItem[]; // minhas repetidas que ele procura (número + nome)
  onClose: () => void;
  onSend: (message: string, wanted: TradeItem[], offered: TradeItem[]) => Promise<void>;
};

const keyOf = (s: TradeItem) => `${s.code}-${s.name}`;

export function TradeRequestModal({ target, wanted, offered, onClose, onSend }: Props) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  // Multi-seleção: por padrão tudo marcado; o usuário desmarca o que não quer.
  const [selWanted, setSelWanted] = useState<Set<string>>(new Set());
  const [selOffered, setSelOffered] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (target) {
      setMessage("");
      setDone(false);
      setError("");
      setSelWanted(new Set(wanted.map(keyOf)));
      setSelOffered(new Set(offered.map(keyOf)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    set((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  async function send() {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const selW = wanted.filter((s) => selWanted.has(keyOf(s)));
      const selO = offered.filter((s) => selOffered.has(keyOf(s)));
      await onSend(message.trim(), selW, selO);
      setDone(true);
    } catch {
      setError("Não foi possível enviar. Tente de novo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {target && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="trade-title">
          <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 cursor-default bg-[color:var(--fifa-night)]/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            <div className="group foil-sheen relative bg-fifa-gradient px-7 pb-6 pt-7 text-white">
              <span className="foil-sheen-layer" aria-hidden />
              <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/35">
                <X className="h-4 w-4" />
              </button>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/80">Pedido de troca</div>
              <h2 id="trade-title" className="mt-1 flex items-center gap-2 font-display text-3xl leading-none">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-sm font-bold text-[color:var(--fifa-green)]">{target.avatar}</span>
                {target.name}
              </h2>
              <p className="mt-2 text-sm text-white/90">{target.city}</p>
            </div>

            {done ? (
              <div className="px-7 py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[color:var(--fifa-green)]/10">
                  <Check className="h-7 w-7 text-[color:var(--fifa-green)]" />
                </div>
                <h3 className="mt-4 font-display text-2xl">Pedido enviado!</h3>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{target.name.split(" ")[0]} vai ver seu pedido em “Meus pedidos” e pode aceitar a troca.</p>
                <button onClick={onClose} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-7 py-3 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Coluna esquerda: figurinhas */}
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">
                          <Sparkles className="h-3.5 w-3.5" /> Você quer dele <span className="font-medium normal-case tracking-normal text-muted-foreground">(toque para escolher)</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {wanted.length ? (
                            wanted.map((s) => {
                              const on = selWanted.has(keyOf(s));
                              return (
                                <button
                                  key={keyOf(s)}
                                  type="button"
                                  onClick={() => toggle(setSelWanted, keyOf(s))}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${on ? "bg-[color:var(--fifa-green)] text-white" : "border border-[color:var(--fifa-green)]/40 text-[color:var(--fifa-green)] opacity-60 hover:opacity-100"}`}
                                >
                                  {s.name}
                                  {s.code ? <span className="opacity-80"> · {s.code}</span> : null}
                                </button>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">Você já tem tudo o que ele oferece — peça mesmo assim se quiser repetidas.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-blue)]">
                          <Repeat className="h-3.5 w-3.5" /> Você pode oferecer <span className="font-medium normal-case tracking-normal text-muted-foreground">(opcional)</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {offered.length ? (
                            offered.map((s) => {
                              const on = selOffered.has(keyOf(s));
                              return (
                                <button
                                  key={keyOf(s)}
                                  type="button"
                                  onClick={() => toggle(setSelOffered, keyOf(s))}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${on ? "bg-[color:var(--fifa-blue)] text-white" : "border border-[color:var(--fifa-blue)]/40 text-[color:var(--fifa-blue)] opacity-60 hover:opacity-100"}`}
                                >
                                  {s.name}
                                  {s.code ? <span className="opacity-70"> · {s.code}</span> : null}
                                </button>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem nada para oferecer? Tudo bem — você pode pedir mesmo assim (marque repetidas em “Meu Álbum” se quiser oferecer).</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coluna direita: mensagem */}
                    <label className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mensagem (opcional)</span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Oi! Topa combinar a troca?"
                        className="mt-1.5 min-h-[140px] w-full flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2 md:min-h-[200px]"
                      />
                    </label>
                  </div>
                </div>

                {/* Rodapé fixo */}
                <div className="border-t border-border bg-card px-6 py-4 sm:px-7">
                  {error && <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
                  <button
                    onClick={send}
                    disabled={sending}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ArrowLeftRight className={`h-4 w-4 transition-transform group-hover:rotate-180 ${sending ? "animate-spin" : ""}`} />
                    {sending ? "Enviando…" : "Enviar pedido de troca"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
