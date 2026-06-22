import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Modal de confirmação estilizado (substitui o window.confirm do navegador).
export function ConfirmModal({ open, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[130] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={title}>
          <button aria-label="Cancelar" onClick={onCancel} className="absolute inset-0 cursor-default bg-[color:var(--fifa-night)]/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-card p-6 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--fifa-green)]/10 text-[color:var(--fifa-green)]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-display text-2xl">{title}</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{message}</p>
            <div className="mt-5 flex gap-2">
              <button onClick={onCancel} className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
                {cancelLabel}
              </button>
              <button onClick={onConfirm} className="flex-1 rounded-full bg-[color:var(--fifa-green)] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
