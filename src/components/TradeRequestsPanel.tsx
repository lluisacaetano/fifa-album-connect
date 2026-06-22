import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Ban, Inbox, Send, Clock } from "lucide-react";
import type { TradeRequest, TradeStatus } from "@/lib/trades";

type Props = {
  open: boolean;
  onClose: () => void;
  requests: TradeRequest[];
  myUid: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

const STATUS: Record<TradeStatus, { label: string; cls: string }> = {
  pending: { label: "Aguardando", cls: "bg-[color:var(--fifa-yellow)]/20 text-[color:var(--fifa-green-deep)]" },
  accepted: { label: "Aceita", cls: "bg-[color:var(--fifa-green)]/15 text-[color:var(--fifa-green)]" },
  declined: { label: "Recusada", cls: "bg-destructive/10 text-destructive" },
};

function Chips({ items, tone }: { items: string[]; tone: "green" | "blue" }) {
  if (!items?.length) return <span className="text-xs text-muted-foreground">—</span>;
  const cls = tone === "green" ? "bg-[color:var(--fifa-green)]/10 text-[color:var(--fifa-green)]" : "bg-[color:var(--fifa-blue)]/10 text-[color:var(--fifa-blue)]";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={s} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

export function TradeRequestsPanel({ open, onClose, requests, myUid, onAccept, onDecline }: Props) {
  const incoming = requests.filter((r) => r.toUid === myUid);
  const outgoing = requests.filter((r) => r.fromUid === myUid);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Meus pedidos de troca">
          <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 cursor-default bg-[color:var(--fifa-night)]/80 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
          >
            <div className="group foil-sheen relative bg-fifa-gradient px-6 py-6 text-white">
              <span className="foil-sheen-layer" aria-hidden />
              <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/35">
                <X className="h-4 w-4" />
              </button>
              <h2 className="font-display text-3xl leading-none">MEUS PEDIDOS</h2>
              <p className="mt-1.5 text-sm text-white/90">Trocas que você recebeu e enviou.</p>
            </div>

            <div className="flex-1 space-y-7 overflow-auto px-6 py-6">
              {/* Recebidos */}
              <section>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">
                  <Inbox className="h-4 w-4" /> Recebidos ({incoming.length})
                </h3>
                {incoming.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Nenhum pedido recebido ainda.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {incoming.map((r) => (
                      <article key={r.id} className="rounded-2xl border border-border bg-background p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{r.fromName}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                        </div>
                        {r.fromCity && <p className="text-xs text-muted-foreground">{r.fromCity}</p>}
                        {r.message && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">{r.message}</p>}
                        <div className="mt-3 space-y-2">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quer suas</div>
                            <div className="mt-1">
                              <Chips items={r.offered} tone="blue" />
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Oferece pra você</div>
                            <div className="mt-1">
                              <Chips items={r.wanted} tone="green" />
                            </div>
                          </div>
                        </div>
                        {r.status === "pending" && (
                          <div className="mt-4 flex gap-2">
                            <button onClick={() => onAccept(r.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
                              <Check className="h-4 w-4" /> Aceitar
                            </button>
                            <button onClick={() => onDecline(r.id)} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted">
                              <Ban className="h-4 w-4" /> Recusar
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Enviados */}
              <section>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-blue)]">
                  <Send className="h-4 w-4" /> Enviados ({outgoing.length})
                </h3>
                {outgoing.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Você ainda não pediu nenhuma troca.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {outgoing.map((r) => (
                      <article key={r.id} className="rounded-2xl border border-border bg-background p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Para {r.toName}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS[r.status].cls}`}>
                            {r.status === "pending" && <Clock className="h-3 w-3" />}
                            {STATUS[r.status].label}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Você pediu</div>
                          <div className="mt-1">
                            <Chips items={r.wanted} tone="green" />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
