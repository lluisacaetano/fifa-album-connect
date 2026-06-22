import { AnimatePresence, motion } from "framer-motion";
import { X, MessageCircle, Trash2 } from "lucide-react";
import type { ChatSummary } from "@/lib/chat";
import type { ChatTarget } from "@/lib/trades-context";
import { Avatar } from "@/components/Avatar";

type Props = {
  open: boolean;
  onClose: () => void;
  summaries: ChatSummary[];
  myUid: string;
  reads: Record<string, number>;
  hidden: Record<string, number>;
  onOpenChat: (t: ChatTarget) => void;
  onDelete: (cid: string) => void;
};

export function MessagesInbox({ open, onClose, summaries, myUid, reads, hidden, onOpenChat, onDelete }: Props) {
  const list = [...summaries]
    .filter((c) => (c.updatedAt?.seconds ?? 0) > (hidden[c.id] ?? 0)) // some se apagada (volta com msg nova)
    .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[105]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Mensagens">
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
              <h2 className="font-display text-3xl leading-none">MENSAGENS</h2>
              <p className="mt-1.5 text-sm text-white/90">Todas as suas conversas em um lugar.</p>
            </div>

            <div className="flex-1 overflow-auto">
              {list.length === 0 ? (
                <div className="grid place-items-center px-6 py-16 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhuma conversa ainda. Fale com alguém pelo pino no mapa.</p>
                </div>
              ) : (
                list.map((c) => {
                  const otherUid = c.participants.find((p) => p !== myUid) ?? c.lastFrom;
                  const otherName = c.names?.[otherUid] ?? (c.lastFrom !== myUid ? c.lastFromName : "Colecionador");
                  const mineLast = c.lastFrom === myUid;
                  // Não lida = a última foi do outro E chegou depois de eu abrir essa conversa.
                  const unread = !mineLast && (c.updatedAt?.seconds ?? 0) > (reads[c.id] ?? 0);
                  return (
                    <div key={c.id} className="flex w-full items-center gap-1 border-b border-border pr-2 transition-colors hover:bg-muted">
                      <button
                        onClick={() => onOpenChat({ uid: otherUid, name: otherName })}
                        className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-5 text-left"
                      >
                        <Avatar name={otherName} size={44} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{otherName}</div>
                          <div className={`truncate text-sm ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                            {mineLast ? "Você: " : ""}
                            {c.lastText}
                          </div>
                        </div>
                        {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--fifa-green)]" aria-label="Nova" />}
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
                        aria-label={`Apagar conversa com ${otherName}`}
                        title="Apagar conversa"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
