import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  receiveCount: number;
  giveCount: number;
  initial?: number;
  onCancel: () => void;
  onConfirm: (value: number) => void;
};

// Modal de valor: as quantidades não bateram, combina-se um R$ pra fechar a
// diferença. É só um registro — o dinheiro é combinado por fora, no chat.
export function ValueModal({ open, receiveCount, giveCount, initial, onCancel, onConfirm }: Props) {
  const [val, setVal] = useState("");
  useEffect(() => {
    if (open) setVal(initial ? String(initial).replace(".", ",") : "");
  }, [open, initial]);

  const num = Math.max(0, Math.round((Number(val.replace(",", ".")) || 0) * 100) / 100);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[120] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Valor da troca">
          <button aria-label="Fechar" onClick={onCancel} className="absolute inset-0 cursor-default bg-[color:var(--fifa-night)]/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-card p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            <button onClick={onCancel} aria-label="Fechar" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70">
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-display text-2xl">Acertar o valor</h3>
            <p className="mt-1 text-sm text-muted-foreground">As quantidades não batem — combinem um valor para fechar a diferença. O app só registra; o pagamento é combinado entre vocês.</p>

            <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-muted/50 py-3 text-sm font-semibold">
              <span className="text-[color:var(--fifa-green)]">você recebe {receiveCount}</span>
              <span className="text-muted-foreground">×</span>
              <span className="text-[color:var(--fifa-blue)]">você dá {giveCount}</span>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valor (R$)</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-background px-3 ring-[color:var(--fifa-green)] focus-within:ring-2">
                <span className="text-sm font-bold text-muted-foreground">R$</span>
                <input
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  inputMode="decimal"
                  placeholder="0,00"
                  autoFocus
                  className="h-11 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <div className="mt-5 flex gap-2">
              <button onClick={onCancel} className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
                Voltar
              </button>
              <button onClick={() => onConfirm(num)} className="flex-1 rounded-full bg-[color:var(--fifa-green)] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
                Propor valor
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
