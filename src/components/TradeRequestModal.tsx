import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeftRight, Check, Sparkles } from "lucide-react";
import type { Trader } from "@/data/traders";
import type { TradeItem } from "@/lib/trades";

type Props = {
  target: Trader | null;
  wanted: TradeItem[]; // figurinhas DELE disponíveis para troca (eu escolho quais quero)
  needs?: Set<string>; // chaves (code-name) das que EU preciso, para marcar "você precisa"
  onClose: () => void;
  onSend: (message: string, wanted: TradeItem[]) => Promise<void>;
};

const keyOf = (s: TradeItem) => `${s.code}-${s.name}`;

export function TradeRequestModal({ target, wanted, needs, onClose, onSend }: Props) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  // Nada pré-marcado: você escolhe o que quer (exige ≥1).
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (target) {
      setMessage("");
      setDone(false);
      setError("");
      setSel(new Set());
    }
  }, [target?.id]);

  const toggle = (key: string) =>
    setSel((prev) => {
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
    if (sending || sel.size === 0) return;
    setSending(true);
    setError("");
    try {
      const selW = wanted.filter((s) => sel.has(keyOf(s)));
      await onSend(message.trim(), selW);
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
            className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
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
                <h3 className="mt-4 font-display text-2xl">Proposta enviada!</h3>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{target.name.split(" ")[0]} vai responder no chat — escolhe o que quer em troca, e vocês combinam.</p>
                <button onClick={onClose} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-7 py-3 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 sm:px-7">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">
                      <Sparkles className="h-3.5 w-3.5" /> O que você quer de {target.name.split(" ")[0]}? <span className="font-medium normal-case tracking-normal text-muted-foreground">(escolha ≥ 1)</span>
                    </div>
                    <div className="mt-2 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {wanted.length ? (
                        wanted.map((s) => {
                          const on = sel.has(keyOf(s));
                          const need = needs?.has(keyOf(s));
                          return (
                            <button
                              key={keyOf(s)}
                              type="button"
                              onClick={() => toggle(keyOf(s))}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${on ? "bg-[color:var(--fifa-green)] text-white" : "border border-[color:var(--fifa-green)]/40 text-[color:var(--fifa-green)] hover:bg-[color:var(--fifa-green)]/10"}`}
                            >
                              {on && <Check className="mr-1 inline h-3 w-3" />}
                              {s.name}
                              {s.code ? <span className="opacity-80"> · {s.code}</span> : null}
                              {need ? <span className={`ml-1 ${on ? "opacity-90" : "opacity-70"}`}>· você precisa</span> : null}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">{target.name.split(" ")[0]} não tem figurinhas disponíveis para troca no momento.</span>
                      )}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mensagem (opcional)</span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Oi! Topa combinar a troca?"
                      rows={3}
                      className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                    />
                  </label>
                </div>

                {/* Rodapé fixo */}
                <div className="border-t border-border bg-card px-6 py-4 sm:px-7">
                  {error && <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
                  <button
                    onClick={send}
                    disabled={sending || sel.size === 0}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeftRight className={`h-4 w-4 transition-transform group-hover:rotate-180 ${sending ? "animate-spin" : ""}`} />
                    {sending ? "Enviando…" : sel.size === 0 ? "Escolha pelo menos uma" : `Enviar proposta (${sel.size})`}
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
