import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Ban, Clock, MessageCircle, Star } from "lucide-react";
import type { TradeItem, TradeRequest } from "@/lib/trades";
import type { ChatTarget } from "@/lib/trades-context";

type Props = {
  open: boolean;
  onClose: () => void;
  requests: TradeRequest[];
  myUid: string;
  onConfirmReceipt: (req: TradeRequest) => void;
  onDecline: (id: string) => void;
  onChat: (t: ChatTarget) => void;
  onRate: (req: TradeRequest, stars: number) => void;
};

function Chips({ items, tone }: { items: TradeItem[]; tone: "green" | "blue" }) {
  const cls = tone === "green" ? "bg-[color:var(--fifa-green)]/10 text-[color:var(--fifa-green)]" : "bg-[color:var(--fifa-blue)]/10 text-[color:var(--fifa-blue)]";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={`${s.code}-${s.name}`} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
          {s.name}
          {s.code ? <span className="opacity-70"> · {s.code}</span> : null}
        </span>
      ))}
    </div>
  );
}

function RequestCard({ r, myUid, onConfirmReceipt, onDecline, onChat, onRate }: { r: TradeRequest; myUid: string } & Pick<Props, "onConfirmReceipt" | "onDecline" | "onChat" | "onRate">) {
  const iAmFrom = r.fromUid === myUid;
  const otherUid = iAmFrom ? r.toUid : r.fromUid;
  const otherName = iAmFrom ? r.toName : r.fromName;
  const otherFirst = otherName.split(" ")[0];
  const iGive = iAmFrom ? r.offered : r.wanted; // o que EU entrego
  const iGet = iAmFrom ? r.wanted : r.offered; // o que EU recebo

  const negotiating = r.status === "pending" && (r.agreedBy?.length ?? 0) < 2;
  const received = r.received ?? [];
  const iAmReceiver = iGet.length > 0;
  const iReceived = received.includes(myUid);
  const otherIsReceiver = iGive.length > 0;
  const otherReceived = received.includes(otherUid);

  const badge =
    r.status === "accepted"
      ? { label: "Finalizada", cls: "bg-[color:var(--fifa-green)]/15 text-[color:var(--fifa-green)]" }
      : r.status === "declined"
        ? { label: "Cancelada", cls: "bg-destructive/10 text-destructive" }
        : negotiating
          ? { label: "Em negociação", cls: "bg-[color:var(--fifa-blue)]/15 text-[color:var(--fifa-blue)]" }
          : { label: "Acordo fechado", cls: "bg-[color:var(--fifa-yellow)]/25 text-[color:var(--fifa-green-deep)]" };

  return (
    <article className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{otherName}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
          {r.status === "pending" && <Clock className="h-3 w-3" />}
          {badge.label}
        </span>
      </div>
      {r.message && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">{r.message}</p>}

      <div className="mt-3 space-y-2">
        {iGive.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-14 shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entrega</span>
            <Chips items={iGive} tone="blue" />
          </div>
        )}
        {iGet.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-14 shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recebe</span>
            <Chips items={iGet} tone="green" />
          </div>
        )}
        {!!r.value && (
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--fifa-yellow)] px-2.5 py-0.5 text-[11px] font-bold text-[color:var(--fifa-green-deep)]">
              💰 R$ {r.value.toFixed(2).replace(".", ",")}
            </span>
          </div>
        )}
      </div>

      {/* Estado */}
      {r.status === "accepted" ? (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[color:var(--fifa-green)]/10 px-3 py-2 text-xs font-bold text-[color:var(--fifa-green)]">
          <Check className="h-3.5 w-3.5" /> Troca finalizada!
        </div>
      ) : r.status === "pending" ? (
        <div className="mt-3">
          {negotiating ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-[color:var(--fifa-blue)]/10 px-3 py-2 text-xs font-medium text-[color:var(--fifa-blue)]">
              <MessageCircle className="h-3.5 w-3.5" /> Em negociação — abram o chat para combinar e topar a troca.
            </div>
          ) : !iAmReceiver ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Aguardando {otherFirst} confirmar o recebimento.
            </div>
          ) : iReceived ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-[color:var(--fifa-green)]/10 px-3 py-2 text-xs font-semibold text-[color:var(--fifa-green)]">
              <Check className="h-3.5 w-3.5" /> Você confirmou o recebimento{otherIsReceiver && !otherReceived ? ` — aguardando ${otherFirst}` : ""}.
            </div>
          ) : (
            <button onClick={() => onConfirmReceipt(r)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
              <Check className="h-4 w-4" /> Confirmar recebimento
            </button>
          )}
        </div>
      ) : null}

      {r.status === "accepted" &&
        ((r.ratedBy ?? []).includes(myUid) ? (
          <p className="mt-2 text-xs text-muted-foreground">Você avaliou {otherFirst}. Valeu!</p>
        ) : (
          <div className="mt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Como foi trocar com {otherFirst}?</div>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => onRate(r, n)} aria-label={`${n} estrela(s)`} className="text-[color:var(--fifa-yellow)] transition-transform hover:scale-110">
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
        ))}

      <div className="mt-3 flex gap-2">
        <button onClick={() => onChat({ uid: otherUid, name: otherName })} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[color:var(--fifa-green)]/40 px-4 py-2 text-sm font-semibold text-[color:var(--fifa-green)] transition-all hover:bg-[color:var(--fifa-green)]/10">
          <MessageCircle className="h-4 w-4" /> Conversar
        </button>
        {/* Cancelar só durante a negociação; depois do acordo não dá mais. */}
        {negotiating && (
          <button onClick={() => onDecline(r.id)} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted">
            <Ban className="h-4 w-4" /> Cancelar
          </button>
        )}
      </div>
    </article>
  );
}

export function TradeRequestsPanel({ open, onClose, requests, myUid, onConfirmReceipt, onDecline, onChat, onRate }: Props) {
  const mine = requests.filter((r) => r.participants.includes(myUid));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Minhas trocas">
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
              <h2 className="font-display text-3xl leading-none">MINHAS TROCAS</h2>
              <p className="mt-1.5 text-sm text-white/90">Quem recebe confirma o recebimento — aí a troca fecha.</p>
            </div>

            <div className="flex-1 space-y-3 overflow-auto px-6 py-6">
              {mine.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma troca ainda. Peça uma no mapa!</p>
              ) : (
                mine.map((r) => <RequestCard key={r.id} r={r} myUid={myUid} onConfirmReceipt={onConfirmReceipt} onDecline={onDecline} onChat={onChat} onRate={onRate} />)
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
