import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { players, initials } from "@/data/players";

const STORAGE_KEY = "album-figurinhas-owned";

// Quais figurinhas já vêm marcadas como "tenho" na 1ª visita (por id).
const defaultOwned = [1, 2, 4, 5, 7, 9, 10, 12, 14, 16, 18];

export function AlbumSection() {
  const [ownedIds, setOwnedIds] = useState<Set<number>>(() => new Set(defaultOwned));

  // Carrega o que estiver salvo no navegador.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setOwnedIds(new Set(JSON.parse(saved) as number[]));
    } catch {
      /* mantém o padrão */
    }
  }, []);

  function toggle(id: number) {
    setOwnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignora */
      }
      return next;
    });
  }

  const cards = useMemo(() => players.map((p) => ({ ...p, owned: ownedIds.has(p.id) })), [ownedIds]);

  const owned = cards.filter((c) => c.owned).length;
  const progress = Math.round((owned / cards.length) * 100);

  return (
    <section id="album" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-5xl text-foreground sm:text-6xl"
            >
              MEU ÁLBUM
            </motion.h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Clique numa figurinha para marcar se você <strong>tem</strong> ou <strong>não tem</strong>. Seu progresso fica salvo neste navegador.
            </p>
          </div>

          <div className="flex gap-4">
            {[
              { l: "Total", v: cards.length },
              { l: "Obtidas", v: owned },
              { l: "Faltando", v: cards.length - owned },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border bg-card px-5 py-3 text-center">
                <div className="font-display text-3xl text-[color:var(--fifa-green)]">{s.v}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-border">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-fifa-gradient"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
          {cards.map((c, i) => (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-pressed={c.owned}
              title={c.owned ? `Você tem ${c.name} — clique para desmarcar` : `Falta ${c.name} — clique se conseguiu`}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              whileHover={{ y: -6, rotate: c.owned ? -2 : 0 }}
              whileTap={{ scale: 0.92 }}
              className={`group foil-sheen relative aspect-[3/4] cursor-pointer rounded-xl border-2 p-[3px] text-left transition-all ${
                c.owned
                  ? "border-[color:var(--fifa-yellow)] bg-fifa-gradient text-white shadow-lg"
                  : "border-dashed border-border bg-muted text-muted-foreground"
              }`}
            >
              {c.owned && <span className="foil-sheen-layer rounded-xl" aria-hidden />}

              {/* selo de status */}
              <span
                className={`absolute right-1 top-1 z-10 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold shadow ${
                  c.owned ? "bg-white text-[color:var(--fifa-green)]" : "bg-card text-muted-foreground"
                }`}
              >
                {c.owned ? "✓" : "+"}
              </span>

              {/* número da camisa */}
              <span className={`absolute left-1.5 top-1 z-10 font-display text-lg leading-none ${c.owned ? "text-white/90" : "text-muted-foreground/60"}`}>
                {c.number}
              </span>

              <div className={`relative flex h-full w-full flex-col items-center justify-end overflow-hidden rounded-lg ${c.owned ? "" : "opacity-60 grayscale"}`}>
                {c.photo ? (
                  <img
                    src={c.photo}
                    alt={c.name}
                    loading="lazy"
                    className="absolute inset-x-0 bottom-0 mx-auto h-[88%] w-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]"
                  />
                ) : (
                  // Fallback para quem não tem foto (ex.: André)
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-4xl opacity-80">{initials(c.name)}</span>
                  </div>
                )}

                {/* faixa com o nome */}
                <div
                  className={`relative z-[1] w-full rounded-md px-1 py-1 text-center font-display text-[11px] leading-tight ${
                    c.owned ? "bg-black/35 text-white" : "bg-foreground/5"
                  }`}
                >
                  {c.name}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
