import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ArrowLeftRight, Check, Ban } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTrades } from "@/lib/trades-context";

type Note = { id: string; icon: "in" | "ok" | "no"; text: string; time: number };

export function NotificationsMenu() {
  const { user } = useAuth();
  const { requests, unread, markSeen, openPanel } = useTrades();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notes = useMemo<Note[]>(() => {
    if (!user) return [];
    const list: Note[] = [];
    for (const r of requests) {
      if (!r.participants.includes(user.uid)) continue;
      const time = r.updatedAt?.seconds ?? r.createdAt?.seconds ?? 0;
      const otherName = r.fromUid === user.uid ? r.toName : r.fromName;
      const iConfirmed = (r.confirms ?? []).includes(user.uid);
      if (r.status === "pending") {
        list.push({ id: r.id, icon: "in", text: iConfirmed ? `Aguardando ${otherName} confirmar a entrega` : `Troca com ${otherName} — confirme sua entrega`, time });
      } else if (r.status === "accepted") {
        list.push({ id: r.id, icon: "ok", text: `Troca com ${otherName} concluída!`, time });
      } else if (r.status === "declined") {
        list.push({ id: r.id, icon: "no", text: `Troca com ${otherName} foi cancelada`, time });
      }
    }
    return list.sort((a, b) => b.time - a.time).slice(0, 12);
  }, [requests, user]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) markSeen();
  }

  const ICON = {
    in: <ArrowLeftRight className="h-3.5 w-3.5 text-[color:var(--fifa-green)]" />,
    ok: <Check className="h-3.5 w-3.5 text-[color:var(--fifa-green)]" />,
    no: <Ban className="h-3.5 w-3.5 text-destructive" />,
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} aria-label="Notificações" className="relative grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/90 transition-all hover:scale-105 hover:bg-white/10">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--fifa-yellow)] px-1 text-[10px] font-bold text-[color:var(--fifa-green-deep)]">{unread}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-[calc(100vw-1.5rem)] max-w-80 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
          >
            <div className="border-b border-border px-4 py-3 font-display text-lg">Notificações</div>
            <div className="max-h-80 overflow-auto">
              {notes.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nada por aqui ainda. Peça uma troca no mapa!</p>
              ) : (
                notes.map((n) => (
                  <button
                    key={`${n.id}-${n.icon}`}
                    onClick={() => {
                      setOpen(false);
                      openPanel();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted">{ICON[n.icon]}</span>
                    <span className="text-sm">{n.text}</span>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => { setOpen(false); openPanel(); }} className="w-full border-t border-border px-4 py-3 text-center text-sm font-semibold text-[color:var(--fifa-green)] transition-colors hover:bg-muted">
              Ver todos os pedidos
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
