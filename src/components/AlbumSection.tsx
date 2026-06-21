import { motion } from "framer-motion";

const players = [
  "Alisson",
  "Bento",
  "Marquinhos",
  "Éder Militão",
  "Gabriel Magalhães",
  "Danilo",
  "Guilherme Arana",
  "Bruno Guimarães",
  "André",
  "Lucas Paquetá",
  "Gerson",
  "Vinícius Júnior",
  "Rodrygo",
  "Raphinha",
  "Savinho",
  "Estêvão",
  "Endrick",
  "Igor Jesus",
];

const stickers = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  owned: [0, 1, 3, 4, 6, 8, 9, 11, 13, 15, 17].includes(i),
  name: players[i],
}));

const owned = stickers.filter((s) => s.owned).length;
const progress = Math.round((owned / stickers.length) * 100);

export function AlbumSection() {
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
            <p className="mt-2 text-sm text-muted-foreground">Acompanhe seu progresso rumo à coleção completa.</p>
          </div>

          <div className="flex gap-4">
            {[
              { l: "Total", v: stickers.length },
              { l: "Obtidas", v: owned },
              { l: "Faltando", v: stickers.length - owned },
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
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full bg-fifa-gradient"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
          {stickers.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              whileHover={{ y: -6, rotate: s.owned ? -2 : 0 }}
              className={`group relative aspect-[3/4] cursor-pointer rounded-xl border-2 p-2 transition-all ${
                s.owned
                  ? "border-[color:var(--fifa-yellow)] bg-fifa-gradient text-white shadow-lg"
                  : "border-dashed border-border bg-muted text-muted-foreground"
              }`}
            >
              <div className={`flex h-full w-full flex-col items-center justify-between rounded-lg p-2 ${s.owned ? "" : "opacity-40 grayscale"}`}>
                <div className="text-[8px] font-bold tracking-widest opacity-80">FIFA 2026</div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 font-display text-lg">★</div>
                <div className="font-display text-[11px] text-center leading-tight">{s.name}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
