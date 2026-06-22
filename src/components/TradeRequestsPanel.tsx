import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Ban, Clock, MessageCircle, Truck, MapPin, Package } from "lucide-react";
import type { DeliveryInfo, DeliveryMethod, TradeRequest } from "@/lib/trades";
import type { ChatTarget } from "@/lib/trades-context";

type Props = {
  open: boolean;
  onClose: () => void;
  requests: TradeRequest[];
  myUid: string;
  onConfirm: (req: TradeRequest, info: DeliveryInfo) => void;
  onDecline: (id: string) => void;
  onChat: (t: ChatTarget) => void;
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

function deliveryLabel(d?: DeliveryInfo) {
  if (!d) return null;
  if (d.method === "presencial") return "Entrega presencial";
  if (d.method === "correios") return `Correios · ${d.tracking ?? "—"}`;
  return `${d.carrier || "Transportadora"} · ${d.tracking ?? "—"}`;
}

function RequestCard({ r, myUid, onConfirm, onDecline, onChat }: { r: TradeRequest; myUid: string } & Pick<Props, "onConfirm" | "onDecline" | "onChat">) {
  const iAmFrom = r.fromUid === myUid;
  const otherUid = iAmFrom ? r.toUid : r.fromUid;
  const otherName = iAmFrom ? r.toName : r.fromName;
  const iGive = iAmFrom ? r.offered : r.wanted; // o que EU entrego
  const iGet = iAmFrom ? r.wanted : r.offered; // o que EU recebo
  const iConfirmed = (r.confirms ?? []).includes(myUid);
  const otherConfirmed = (r.confirms ?? []).includes(otherUid);

  const [form, setForm] = useState(false);
  const [method, setMethod] = useState<DeliveryMethod>("presencial");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  function confirm() {
    if (method !== "presencial" && !tracking.trim()) return;
    onConfirm(r, { method, tracking: tracking.trim() || undefined, carrier: carrier.trim() || undefined });
    setForm(false);
    setTracking("");
    setCarrier("");
  }

  const badge =
    r.status === "accepted"
      ? { label: "Concluída", cls: "bg-[color:var(--fifa-green)]/15 text-[color:var(--fifa-green)]" }
      : r.status === "declined"
        ? { label: "Cancelada", cls: "bg-destructive/10 text-destructive" }
        : { label: "Pendente", cls: "bg-[color:var(--fifa-yellow)]/25 text-[color:var(--fifa-green-deep)]" };

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

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Você entrega</div>
          <div className="mt-1"><Chips items={iGive} tone="blue" /></div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Você recebe</div>
          <div className="mt-1"><Chips items={iGet} tone="green" /></div>
        </div>
      </div>

      {/* Estado da confirmação */}
      {r.status === "accepted" ? (
        <div className="mt-3 space-y-1 rounded-xl bg-[color:var(--fifa-green)]/10 px-3 py-2 text-xs text-[color:var(--fifa-green)]">
          <div className="flex items-center gap-1.5 font-bold">
            <Check className="h-3.5 w-3.5" /> Os dois confirmaram — troca fechada!
          </div>
          {r.delivery && (
            <div className="text-muted-foreground">
              {Object.entries(r.delivery).map(([uid, d]) => {
                const who = uid === myUid ? "Você" : otherName;
                const isCorreios = d.method === "correios" && d.tracking;
                return (
                  <div key={uid}>
                    {who}: {isCorreios ? (
                      <a href={`https://rastreamento.correios.com.br/app/index.php?codigo=${d.tracking}`} target="_blank" rel="noreferrer" className="font-semibold text-[color:var(--fifa-green)] underline">
                        rastrear {d.tracking}
                      </a>
                    ) : (
                      deliveryLabel(d)
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : r.status === "pending" ? (
        <div className="mt-3">
          {iConfirmed ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Você confirmou. Aguardando {otherName.split(" ")[0]} confirmar a entrega.
            </div>
          ) : !form ? (
            <button onClick={() => setForm(true)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
              <Package className="h-4 w-4" /> Confirmar entrega
            </button>
          ) : (
            <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Como você vai entregar?</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  ["presencial", "Pessoal"],
                  ["correios", "Correios"],
                  ["transportadora", "Transp."],
                ] as const).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setMethod(key)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${method === key ? "bg-[color:var(--fifa-green)] text-white" : "border border-border bg-card hover:border-[color:var(--fifa-green)]"}`}>
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
              <button onClick={confirm} disabled={method !== "presencial" && !tracking.trim()} className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--fifa-green)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)] disabled:opacity-50">
                {method === "presencial" ? <MapPin className="h-4 w-4" /> : <Truck className="h-4 w-4" />} Confirmar meu lado
              </button>
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button onClick={() => onChat({ uid: otherUid, name: otherName })} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[color:var(--fifa-green)]/40 px-4 py-2 text-sm font-semibold text-[color:var(--fifa-green)] transition-all hover:bg-[color:var(--fifa-green)]/10">
          <MessageCircle className="h-4 w-4" /> Conversar
        </button>
        {r.status === "pending" && (
          <button onClick={() => onDecline(r.id)} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted">
            <Ban className="h-4 w-4" /> Cancelar
          </button>
        )}
      </div>
    </article>
  );
}

export function TradeRequestsPanel({ open, onClose, requests, myUid, onConfirm, onDecline, onChat }: Props) {
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
              <p className="mt-1.5 text-sm text-white/90">A troca fecha quando os dois confirmam a entrega.</p>
            </div>

            <div className="flex-1 space-y-3 overflow-auto px-6 py-6">
              {mine.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma troca ainda. Peça uma no mapa!</p>
              ) : (
                mine.map((r) => <RequestCard key={r.id} r={r} myUid={myUid} onConfirm={onConfirm} onDecline={onDecline} onChat={onChat} />)
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
